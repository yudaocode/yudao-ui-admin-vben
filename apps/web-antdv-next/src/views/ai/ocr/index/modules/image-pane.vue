<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Card } from 'antdv-next';

/** AI 文字识别：左侧原图（选择、拖拽、缩放） */
defineOptions({ name: 'AiOcrImagePane' });

const props = defineProps<{
  disabled?: boolean; // 识别中时，不允许更换图片
  fileName?: string; // 文件名
  src?: string; // 图片地址：本地预览的 ObjectURL，或历史记录的图片地址
}>();

const emit = defineEmits<{
  select: [file: File];
}>();

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const STEP = 0.25;

const inputRef = ref<HTMLInputElement>();
const imageRef = ref<HTMLImageElement>();
const fit = ref(true); // 是否适应容器
const scale = ref(1); // 缩放比例，相对图片原始尺寸
const naturalWidth = ref(0); // 图片原始宽度
const dragging = ref(false); // 是否拖拽悬停中

const imageStyle = computed(() =>
  fit.value || !naturalWidth.value
    ? {}
    : { width: `${naturalWidth.value * scale.value}px` },
);

/** 图片加载完成：记录原始宽度 */
function handleLoad() {
  naturalWidth.value = imageRef.value?.naturalWidth || 0;
}

/** 切换图片时，回到适应模式 */
watch(
  () => props.src,
  () => {
    fit.value = true;
    scale.value = 1;
    naturalWidth.value = 0;
  },
);

/** 当前实际显示比例：从适应切到缩放时，以它为起点 */
function getDisplayScale() {
  const image = imageRef.value;
  if (!image || !naturalWidth.value) {
    return 1;
  }
  return image.clientWidth / naturalWidth.value;
}

/** 缩放 */
function zoom(delta: number) {
  const base = fit.value ? getDisplayScale() : scale.value;
  fit.value = false;
  scale.value = Math.min(
    MAX_SCALE,
    Math.max(MIN_SCALE, Math.round((base + delta) * 100) / 100),
  );
}

/** 在适应、原始大小之间切换 */
function toggleFit() {
  if (fit.value) {
    fit.value = false;
    scale.value = 1;
  } else {
    fit.value = true;
  }
}

/** 选择文件 */
function chooseFile() {
  if (props.disabled) {
    return;
  }
  inputRef.value?.click();
}

function handleInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ''; // 允许再次选择同一个文件
  if (file) {
    emit('select', file);
  }
}

/** 拖拽 */
function handleDragOver() {
  if (!props.disabled) {
    dragging.value = true;
  }
}

function handleDrop(event: DragEvent) {
  dragging.value = false;
  if (props.disabled) {
    return;
  }
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    emit('select', file);
  }
}

defineExpose({ chooseFile });
</script>

<template>
  <Card
    class="h-full w-full"
    :styles="{
      body: { height: '100%', display: 'flex', flexDirection: 'column' },
    }"
  >
    <div class="mb-3 flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-base font-bold">原图</span>
        <span v-if="fileName" class="truncate text-xs text-gray-500">
          {{ fileName }}
        </span>
      </div>
      <div v-if="src" class="flex flex-shrink-0 items-center gap-1">
        <Button
          size="small"
          :disabled="fit || scale <= MIN_SCALE"
          @click="zoom(-STEP)"
        >
          <IconifyIcon icon="lucide:zoom-out" />
        </Button>
        <Button size="small" class="w-14" @click="toggleFit">
          {{ fit ? '适应' : `${Math.round(scale * 100)}%` }}
        </Button>
        <Button
          size="small"
          :disabled="!fit && scale >= MAX_SCALE"
          @click="zoom(STEP)"
        >
          <IconifyIcon icon="lucide:zoom-in" />
        </Button>
        <Button size="small" :disabled="disabled" @click="chooseFile">
          更换图片
        </Button>
      </div>
    </div>

    <div
      class="relative min-h-0 flex-1 overflow-auto rounded-lg border border-dashed bg-gray-50 dark:bg-gray-900"
      :class="dragging ? 'border-primary' : 'border-border'"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="dragging = false"
      @drop.prevent="handleDrop"
    >
      <!-- 空状态：点击、拖拽、粘贴 -->
      <div
        v-if="!src"
        class="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-gray-500"
        @click="chooseFile"
      >
        <IconifyIcon icon="lucide:image-up" class="size-12 text-primary" />
        <div class="text-sm">
          点击选择、拖拽图片到这里，或直接 Ctrl / ⌘ + V 粘贴截图
        </div>
      </div>
      <!-- 原图：适应时完整显示，否则按比例缩放、可滚动 -->
      <div
        v-else
        class="flex min-h-full min-w-full items-center justify-center p-3"
      >
        <img
          ref="imageRef"
          :src="src"
          alt="原图"
          class="block select-none"
          :class="fit ? 'max-h-full max-w-full object-contain' : 'max-w-none'"
          :style="imageStyle"
          draggable="false"
          @load="handleLoad"
        />
      </div>
    </div>

    <input
      ref="inputRef"
      type="file"
      class="hidden"
      accept="image/*"
      @change="handleInputChange"
    />
  </Card>
</template>
