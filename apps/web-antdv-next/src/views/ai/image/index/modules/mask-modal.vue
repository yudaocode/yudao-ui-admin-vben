<script lang="ts" setup>
import type { AiImageApi } from '#/api/ai/image';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  message,
  RadioButton,
  RadioGroup,
  Slider,
  TextArea,
} from 'antdv-next';

import { midjourneyModal } from '#/api/ai/image';
import { useUpload } from '#/components/upload/use-upload';

/** AI 绘图：Midjourney 局部重绘（涂抹蒙版：黑底，白色为重绘区域） */
defineOptions({ name: 'AiImageMaskModal' });

const emit = defineEmits<{
  success: [];
}>();

const PROMPT_MAX = 1200; // 与 AiMidjourneyModalReqVO.prompt 上限一致
const BRUSH_COLOR = '#1677ff'; // 涂抹层的显示颜色

interface Stroke {
  tool: string; // 工具：brush - 画笔；eraser - 橡皮擦
  size: number; // 原图像素
  points: { x: number; y: number }[]; // 原图坐标
}

const image = ref<AiImageApi.Image>(); // 来源图片
const prompt = ref(''); // 重绘提示词
const tool = ref('brush'); // 工具：brush - 画笔；eraser - 橡皮擦
const brushSize = ref(60); // 屏幕像素
const strokes = ref<Stroke[]>([]); // 已完成的笔画
const canvasRef = ref<HTMLCanvasElement>();
let drawing: Stroke | undefined; // 正在绘制的笔画

/** 图片加载完成：画布使用原图尺寸，蒙版与原图一一对应 */
function handleImageLoad(event: Event) {
  const img = event.target as HTMLImageElement;
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  redraw();
}

/** 屏幕坐标 → 原图坐标；笔刷大小按同一比例换算 */
function getScale() {
  const canvas = canvasRef.value as HTMLCanvasElement;
  return canvas.width / canvas.getBoundingClientRect().width;
}
function getPoint(event: PointerEvent) {
  const canvas = canvasRef.value as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

/** 绘制笔画；mask 为 true 时画到蒙版（画笔白色、橡皮擦黑色） */
function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  mask: boolean,
) {
  const [first, ...rest] = stroke.points;
  if (!first) {
    return;
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = stroke.size;
  if (mask) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.tool === 'brush' ? '#ffffff' : '#000000';
  } else {
    ctx.globalCompositeOperation =
      stroke.tool === 'brush' ? 'source-over' : 'destination-out';
    ctx.strokeStyle = BRUSH_COLOR;
  }
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  if (rest.length === 0) {
    ctx.arc(first.x, first.y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.moveTo(first.x, first.y);
    rest.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();
  }
  ctx.restore();
}

/** 重绘涂抹层 */
function redraw() {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.value.forEach((stroke) => drawStroke(ctx, stroke, false));
  if (drawing) {
    drawStroke(ctx, drawing, false);
  }
}

function handlePointerDown(event: PointerEvent) {
  if (!canvasRef.value?.width) {
    return;
  }
  (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
  drawing = {
    tool: tool.value,
    size: brushSize.value * getScale(),
    points: [getPoint(event)],
  };
  redraw();
}
function handlePointerMove(event: PointerEvent) {
  if (!drawing) {
    return;
  }
  drawing.points.push(getPoint(event));
  redraw();
}
function handlePointerUp() {
  if (!drawing) {
    return;
  }
  strokes.value.push(drawing);
  drawing = undefined;
  redraw();
}

/** 撤销、清空 */
function handleUndo() {
  strokes.value.pop();
  redraw();
}
function handleClear() {
  strokes.value = [];
  redraw();
}

/** 生成蒙版图片：黑底，白色为重绘区域 */
async function buildMaskFile(): Promise<File> {
  const source = canvasRef.value as HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  strokes.value.forEach((stroke) => drawStroke(ctx, stroke, true));
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) {
    throw new Error('蒙版生成失败');
  }
  return new File([blob], `mask-${image.value?.id}-${Date.now()}.png`, {
    type: 'image/png',
  });
}

const [Modal, modalApi] = useVbenModal({
  confirmText: '提交重绘',
  onConfirm: handleSubmit,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      image.value = undefined;
      return;
    }
    const source = modalApi.getData() as AiImageApi.Image;
    image.value = source;
    prompt.value = source?.prompt || '';
    strokes.value = [];
    tool.value = 'brush';
    // 同一张图片再次打开时不会触发 load：清除上次的涂抹
    await nextTick();
    redraw();
  },
});

/** 提交：蒙版上传到文件服务，再提交局部重绘 */
const { httpRequest } = useUpload('ai/image');
async function handleSubmit() {
  if (!strokes.value.some((stroke) => stroke.tool === 'brush')) {
    message.warning('请先涂抹需要重绘的区域');
    return;
  }
  if (!prompt.value.trim()) {
    message.warning('请输入重绘提示词');
    return;
  }
  modalApi.lock();
  try {
    const file = await buildMaskFile();
    const result: any = await httpRequest(file);
    await midjourneyModal({
      id: image.value?.id as number,
      prompt: prompt.value,
      maskUrl: result?.url || result?.data || result,
    });
    message.success('已提交局部重绘');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal title="局部重绘" class="w-[760px]">
    <div class="flex flex-col gap-3">
      <!-- 工具栏 -->
      <div class="flex flex-wrap items-center gap-3">
        <RadioGroup v-model:value="tool" button-style="solid" size="small">
          <RadioButton value="brush">画笔</RadioButton>
          <RadioButton value="eraser">橡皮擦</RadioButton>
        </RadioGroup>
        <div class="flex items-center gap-2 text-xs">
          笔刷
          <Slider
            v-model:value="brushSize"
            :min="10"
            :max="200"
            class="!my-0 w-40"
          />
        </div>
        <Button
          size="small"
          :disabled="strokes.length === 0"
          @click="handleUndo"
        >
          撤销
        </Button>
        <Button
          size="small"
          :disabled="strokes.length === 0"
          @click="handleClear"
        >
          清空
        </Button>
        <span class="text-xs text-gray-500">涂抹需要重绘的区域</span>
      </div>
      <!-- 画布：图片 + 涂抹层 -->
      <div class="flex justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <div class="relative inline-block max-w-full leading-none">
          <img
            v-if="image"
            :src="image.picUrl"
            class="block max-h-[480px] max-w-full select-none"
            draggable="false"
            @load="handleImageLoad"
          />
          <canvas
            ref="canvasRef"
            class="absolute left-0 top-0 size-full cursor-crosshair touch-none opacity-50"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointerleave="handlePointerUp"
          ></canvas>
        </div>
      </div>
      <TextArea
        v-model:value="prompt"
        :rows="3"
        :maxlength="PROMPT_MAX"
        show-count
        placeholder="描述重绘区域的内容，例如：换成一顶红色的帽子"
      />
    </div>
  </Modal>
</template>
