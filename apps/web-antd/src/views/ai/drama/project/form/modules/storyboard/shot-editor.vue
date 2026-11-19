<script lang="ts" setup>
import type { StoryboardFieldsState } from './storyboard-fields';

import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { confirm, prompt } from '@vben/common-ui';
import { isAiDramaRunning } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  ButtonGroup,
  Divider,
  Input,
  message,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { undoDramaVisualAssetImage } from '#/api/ai/drama/asset';
import {
  deleteDramaStoryboard,
  generateDramaStoryboardFrame,
  generateDramaStoryboardVideo,
  renderDramaStoryboardMaterial,
  updateDramaStoryboard,
  useDramaPreviousLastFrame,
} from '#/api/ai/drama/storyboard';
import AssetImage from '#/views/ai/drama/components/asset-image.vue';
import { getDramaStoryboardFrame, hasDramaArchive } from '#/views/ai/utils/drama';

import ImportVideoForm from './import-video-form.vue';
import ShotVideoResult from './shot-video-result.vue';
import StoryboardFields from './storyboard-fields.vue';
import VideoSubmissionDialog from './video-submission-dialog.vue';
import VoiceDialog from './voice-dialog.vue';

/** AI 短剧：单镜编辑区，编辑镜头字段、起始帧，原位查看视频结果；保存、重新生成只在底部出现一次 */
defineOptions({ name: 'AiDramaShotEditor' });

const props = defineProps<{
  detail: AiDramaProjectApi.ProjectDetail;
  imageModelId?: number; // 绘画模型：生成关键帧
  index: number; // 在当前镜头列表中的位置
  modelText?: string; // 本镜使用的视频模型
  resolution?: string; // 默认分辨率
  scriptChanged: boolean; // 剧本已修改：不能生成关键帧、视频
  storyboard: AiDramaStoryboardApi.Storyboard;
  total: number;
  videoModelId?: number; // 默认视频模型
}>();
/** select：切到上一镜（-1）、下一镜（1）；create：新增镜头 */
const emit = defineEmits<{
  create: [];
  refresh: [];
  select: [offset: number];
}>();

const fieldsRef = ref<InstanceType<typeof StoryboardFields>>();
const submissionRef = ref<InstanceType<typeof VideoSubmissionDialog>>();
const voiceRef = ref<InstanceType<typeof VoiceDialog>>();
const importVideoRef = ref<InstanceType<typeof ImportVideoForm>>();
const saving = ref(false); // 保存中
const generating = ref(false); // 提交生成视频中
/** 未保存的修改：切换镜头时暂存，切回时恢复；不弹确认 */
const drafts = new Map<number, StoryboardFieldsState>();

const running = computed(() => isAiDramaRunning(props.storyboard.videoStatus));
const frame = computed(() =>
  getDramaStoryboardFrame(props.detail.visualAssets, props.storyboard.id),
);
const dirty = computed<boolean>(() => !!fieldsRef.value?.dirty);

/**
 * 切换镜头时：暂存上一镜的未保存修改，加载本镜（有暂存时恢复）；
 * 同一镜头的轮询刷新：没有未保存的修改时重新加载，有时保留草稿，只由视频结果等区域展示最新状态
 */
watch(
  () => props.storyboard,
  async (storyboard, old) => {
    await nextTick();
    if (!fieldsRef.value) {
      return;
    }
    if (old && old.id !== storyboard.id) {
      if (fieldsRef.value.dirty) {
        drafts.set(old.id, fieldsRef.value.getState());
      }
      fieldsRef.value.load(storyboard, drafts.get(storyboard.id));
      drafts.delete(storyboard.id);
      return;
    }
    if (!old || !fieldsRef.value.dirty) {
      fieldsRef.value.load(storyboard);
    }
  },
  { immediate: true },
);

/** 组件已卸载：离开后迟到的回包不再写入表单 */
let disposed = false;
onBeforeUnmount(() => {
  disposed = true;
});

/** 回包时是否仍在编辑发起操作的镜头：快速切镜、离开后迟到的回包不能写入其它镜头的表单 */
function isCurrent(storyboardId: number) {
  return !disposed && props.storyboard.id === storyboardId;
}

/** 生成请求编号：每次点击一个，服务端据此识别重复提交 */
function generateRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, (char) => {
    const random = Math.trunc(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * 保存镜头：按发起时的镜头与表单快照提交
 *
 * 1. 回包时仍在该镜头、且保存期间没有继续编辑：按保存的内容重新加载，之后的刷新取服务端结果
 * 2. 回包时仍在该镜头、但保存期间又有编辑：保留编辑，仍为未保存
 * 3. 回包时已切到其它镜头：不动当前表单；该镜头暂存的草稿与保存的内容一致时丢弃（已保存）
 *
 * @return 保存的镜头编号
 */
async function save(): Promise<number> {
  const storyboard = props.storyboard;
  const data = { ...fieldsRef.value!.buildData(), id: storyboard.id };
  const state = JSON.stringify(fieldsRef.value!.getState());
  await updateDramaStoryboard(data);
  if (isCurrent(storyboard.id)) {
    if (JSON.stringify(fieldsRef.value!.getState()) === state) {
      fieldsRef.value!.load({ ...storyboard, ...data });
    }
  } else {
    const draft = drafts.get(storyboard.id);
    if (draft && JSON.stringify(draft) === state) {
      drafts.delete(storyboard.id);
    }
  }
  return storyboard.id;
}

/** 保存镜头 */
async function handleSave() {
  saving.value = true;
  try {
    await save();
    message.success('保存成功');
    emit('refresh');
  } finally {
    saving.value = false;
  }
}

/**
 * 生成视频：有未保存的修改时先保存，视频按保存后的镜头生成；镜头、模型、分辨率都取发起时的，回包期间切镜不影响；
 * 每次点击一个请求编号，服务端据此识别重复提交
 */
async function handleGenerateVideo() {
  const storyboardId = props.storyboard.id;
  const videoModelId = props.videoModelId!;
  const resolution = props.resolution;
  generating.value = true;
  try {
    const saved = fieldsRef.value!.dirty;
    if (saved) {
      await save();
    }
    await generateDramaStoryboardVideo(
      storyboardId,
      videoModelId,
      resolution,
      generateRequestId(),
    );
    message.success(saved ? '已保存镜头并提交生成' : '已提交生成');
    emit('refresh');
  } finally {
    generating.value = false;
  }
}

/** 删除镜头：一并清掉它暂存的未保存修改 */
async function handleDelete() {
  const storyboardId = props.storyboard.id;
  try {
    await confirm('删除镜头会一并删除其关键帧，是否继续？');
  } catch {
    return;
  }
  await deleteDramaStoryboard(storyboardId);
  drafts.delete(storyboardId);
  message.success('删除成功');
  emit('refresh');
}

/** 更多操作：提交记录、镜头声音、导入视频、素材成片 */
async function handleCommand(command: string) {
  const storyboard = props.storyboard;
  if (command === 'submission') {
    submissionRef.value?.open(storyboard);
  } else if (command === 'voice') {
    voiceRef.value?.open(storyboard);
  } else if (command === 'importVideo') {
    importVideoRef.value?.open(storyboard);
  } else if (command === 'material') {
    // 素材成片：素材图片直接渲染为镜头视频，不调用视频模型
    await renderDramaStoryboardMaterial(storyboard.id);
    message.success('已开始渲染素材');
    emit('refresh');
  }
}

// ========== 关键帧 ==========

/** 生成关键帧 */
async function handleGenerateFrame() {
  await generateDramaStoryboardFrame(props.storyboard.id, props.imageModelId!);
  message.success('已提交生成关键帧');
  emit('refresh');
}

/** 修正构图：以当前关键帧为参考，按修正说明重新生成；镜头取发起时的，输入修正说明期间切镜不影响 */
async function handleReviseFrame() {
  const storyboardId = props.storyboard.id;
  const imageModelId = props.imageModelId!;
  let revisePrompt: string | undefined;
  try {
    revisePrompt = await prompt<string>({
      title: '修正构图',
      content: '请输入修正说明，例如：人物移到画面左侧',
      component: Input.TextArea,
      componentProps: { placeholder: '修正说明', rows: 3 },
      modelPropName: 'value',
      defaultValue: '',
    });
  } catch {
    return;
  }
  revisePrompt = revisePrompt?.trim();
  if (!revisePrompt) {
    message.warning('修正说明不能为空');
    return;
  }
  await generateDramaStoryboardFrame(storyboardId, imageModelId, revisePrompt);
  message.success('已提交修正构图');
  emit('refresh');
}

/** 撤销关键帧：恢复为上一版 */
async function handleUndoFrame(id: number) {
  try {
    await confirm('撤销后恢复为上一版关键帧，是否继续？');
  } catch {
    return;
  }
  await undoDramaVisualAssetImage(id);
  message.success('已撤销');
  emit('refresh');
}

/** 承接上一镜：上一镜视频的尾帧作为本镜的手动起始帧；有未保存的修改时提示，避免保存时覆盖 */
async function handleUsePreviousLastFrame() {
  if (fieldsRef.value?.dirty) {
    message.warning('请先保存本镜的修改，再承接上一镜');
    return;
  }
  await useDramaPreviousLastFrame(props.storyboard.id);
  message.success('已使用上一镜的尾帧作为起始帧');
  emit('refresh');
}
</script>

<template>
  <div>
    <!-- 标题栏：切镜、删除、新增 -->
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <span class="text-base font-medium">镜 {{ storyboard.sceneNo }}</span>
      <ButtonGroup>
        <Button size="small" :disabled="index <= 0" @click="emit('select', -1)">
          <IconifyIcon icon="lucide:arrow-left" />
        </Button>
        <Button size="small" disabled>{{ index + 1 }} / {{ total }}</Button>
        <Button
          size="small"
          :disabled="index >= total - 1"
          @click="emit('select', 1)"
        >
          <IconifyIcon icon="lucide:arrow-right" />
        </Button>
      </ButtonGroup>
      <span class="truncate text-sm">{{ storyboard.title || '未命名镜头' }}</span>
      <Tag v-if="dirty" color="warning">未保存</Tag>
      <div class="flex-1"></div>
      <Button type="link" danger :disabled="running" @click="handleDelete">
        删除
      </Button>
      <Button @click="emit('create')">
        <IconifyIcon icon="lucide:plus" class="mr-1 inline" />
        新增镜头
      </Button>
    </div>

    <StoryboardFields ref="fieldsRef" :detail="detail" />

    <!-- 起始帧：关键帧的生成、修正、撤销，承接上一镜；操作即时生效 -->
    <Divider orientation="left">起始帧</Divider>
    <div class="flex flex-wrap items-start gap-3">
      <AssetImage
        :url="frame?.imageUrl"
        :status="frame?.status"
        :error-message="frame?.errorMessage"
        size="96px"
      />
      <div class="flex flex-col gap-1.5">
        <div>
          <Tooltip
            v-if="storyboard.continuity?.manualStartFrame?.url"
            title="已设置手动起始帧，生成视频时优先使用"
            placement="top"
          >
            <Tag color="warning">手动起始帧</Tag>
          </Tooltip>
        </div>
        <div>
          <Button
            type="link"
            :disabled="
              !imageModelId || scriptChanged || isAiDramaRunning(frame?.status)
            "
            @click="handleGenerateFrame"
          >
            {{ frame ? '重新生成关键帧' : '生成关键帧' }}
          </Button>
          <Button
            v-if="frame?.imageUrl"
            type="link"
            :disabled="
              !imageModelId || scriptChanged || isAiDramaRunning(frame?.status)
            "
            @click="handleReviseFrame"
          >
            修正构图
          </Button>
          <Button
            v-if="frame && hasDramaArchive(detail.visualAssets, frame.id)"
            type="link"
            :disabled="isAiDramaRunning(frame.status)"
            @click="handleUndoFrame(frame.id)"
          >
            撤销
          </Button>
          <Button
            v-if="index > 0"
            type="link"
            :disabled="running"
            @click="handleUsePreviousLastFrame"
          >
            承接上一镜
          </Button>
        </div>
      </div>
    </div>

    <Divider />
    <ShotVideoResult
      :storyboard="storyboard"
      :model-text="modelText"
      @command="handleCommand"
    />

    <!-- 底部操作条：吸底，滚动时盖住下方内容 -->
    <div
      class="bg-card border-border sticky bottom-0 z-10 mt-4 flex items-center justify-end gap-2 border-t border-solid pb-1 pt-3"
    >
      <span v-if="running" class="text-muted-foreground text-xs">
        视频生成中，暂不能修改
      </span>
      <Button
        :disabled="!videoModelId || scriptChanged || running"
        :loading="generating"
        @click="handleGenerateVideo"
      >
        {{ storyboard.videoStatus ? '重新生成视频' : '生成视频' }}
      </Button>
      <Button type="primary" :disabled="running" :loading="saving" @click="handleSave">
        保存镜头
      </Button>
    </div>

    <VideoSubmissionDialog ref="submissionRef" @success="emit('refresh')" />
    <VoiceDialog ref="voiceRef" :detail="detail" @success="emit('refresh')" />
    <ImportVideoForm ref="importVideoRef" @success="emit('refresh')" />
  </div>
</template>
