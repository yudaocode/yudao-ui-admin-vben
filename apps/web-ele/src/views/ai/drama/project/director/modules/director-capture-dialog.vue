<script lang="ts" setup>
import type { DirectorDocument } from '../director';

import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { computed, onBeforeUnmount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElProgress,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElUpload,
} from 'element-plus';

import { captureVideo } from '../director-capture';

/** AI 短剧 3D 导演：从参考视频提取动作。本地视频或项目已有视频 → 浏览器内 MediaPipe 识别姿态 → 可编辑的白模关键帧；不使用摄像头、麦克风，视频不上传 */
defineOptions({ name: 'AiDramaDirectorCaptureDialog' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{ import: [document: DirectorDocument] }>();

const MAX_FILE_SIZE = 200 * 1024 * 1024;

const sourceType = ref<'local' | 'project'>('local');
const source = ref('');
const fileName = ref('');
const projectVideoUrl = ref<string>();
const start = ref(0);
const end = ref(60);
const running = ref(false);
const progress = ref(0);
const result = ref<Awaited<ReturnType<typeof captureVideo>>>();
let controller: AbortController | undefined;
let blobUrl = '';

/** 项目中已有的视频：动作参考、已完成的镜头视频 */
const projectVideos = computed(() => [
  ...(props.detail.motionReferences || []).map((item) => ({
    value: item.fileUrl,
    label: `动作参考 · ${item.name}`,
  })),
  ...props.detail.storyboards
    .filter((item) => item.videoUrl)
    .map((item) => ({
      value: item.videoUrl!,
      label: `镜头 #${item.sceneNo} ${item.title || ''}`,
    })),
]);

function release() {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }
  blobUrl = '';
}

const [Modal, modalApi] = useVbenModal({
  onBeforeClose() {
    controller?.abort();
    return true;
  },
});

function open() {
  result.value = undefined;
  progress.value = 0;
  modalApi.open();
}
defineExpose({ open });

/** 选择本地视频：只在本机读取，不上传 */
function handleBeforeUpload(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    ElMessage.warning('视频不能超过 200MB');
    return false;
  }
  release();
  blobUrl = URL.createObjectURL(file);
  source.value = blobUrl;
  fileName.value = file.name;
  result.value = undefined;
  return false;
}

function handleProjectVideoChange(url: unknown) {
  release();
  source.value = url as string;
  result.value = undefined;
}

async function handleCapture() {
  running.value = true;
  progress.value = 0;
  result.value = undefined;
  controller = new AbortController();
  try {
    result.value = await captureVideo(
      source.value,
      start.value,
      end.value,
      (value) => (progress.value = value),
      controller.signal,
    );
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '动作解析失败');
  } finally {
    running.value = false;
  }
}

async function handleApply() {
  emit('import', result.value!.document);
  await modalApi.close();
}

onBeforeUnmount(() => {
  controller?.abort();
  release();
});
</script>

<template>
  <Modal title="从参考视频提取动作" class="w-[640px]">
    <ElAlert
      type="info"
      show-icon
      :closable="false"
      class="mb-3"
      title="选择单人视频，在浏览器中识别关节动作，生成可编辑的白模关键帧。遮挡、转身和近景中看不到的肢体需手动修正。"
    />
    <ElForm label-width="90px">
      <ElFormItem label="视频来源">
        <ElRadioGroup v-model="sourceType" :disabled="running">
          <ElRadioButton value="local">本地视频</ElRadioButton>
          <ElRadioButton value="project">项目中的视频</ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem v-if="sourceType === 'local'" label="本地视频">
        <div class="flex items-center">
          <ElUpload
            :show-file-list="false"
            accept="video/*"
            :disabled="running"
            :before-upload="handleBeforeUpload"
          >
            <ElButton :disabled="running">选择视频</ElButton>
          </ElUpload>
          <span class="text-muted-foreground ml-2 truncate text-xs">
            {{ fileName || '不超过 200MB，只在本机读取' }}
          </span>
        </div>
      </ElFormItem>
      <ElFormItem v-else label="项目视频">
        <ElSelect
          v-model="projectVideoUrl"
          placeholder="动作参考或已完成的镜头视频"
          filterable
          class="w-full"
          :disabled="running"
          @change="handleProjectVideoChange"
        >
          <ElOption
            v-for="item in projectVideos"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="source" label="预览">
        <video
          :src="source"
          controls
          preload="metadata"
          class="max-h-[220px] w-full rounded bg-black"
          :crossorigin="sourceType === 'project' ? 'anonymous' : undefined"
        ></video>
      </ElFormItem>
      <ElFormItem label="区间（秒）">
        <div class="flex items-center">
          <ElInputNumber
            v-model="start"
            :min="0"
            :step="0.1"
            :precision="1"
            :disabled="running"
          />
          <span class="mx-2">至</span>
          <ElInputNumber
            v-model="end"
            :min="2"
            :max="600"
            :step="0.1"
            :precision="1"
            :disabled="running"
          />
        </div>
        <div class="text-muted-foreground mt-1 w-full text-xs">
          2~60 秒，每秒采样 12 次，输出 24
          fps；应用会替换当前导演工程，未保存的修改先下载备份
        </div>
      </ElFormItem>
      <ElFormItem v-if="running" label="进度">
        <div class="flex items-center">
          <ElProgress :percentage="Math.round(progress * 100)" class="flex-1" />
          <ElButton
            link
            type="primary"
            class="ml-2"
            @click="controller?.abort()"
          >
            取消
          </ElButton>
        </div>
      </ElFormItem>
      <ElFormItem v-if="result" label="结果">
        <span class="text-[13px]">
          已识别 {{ result.detected }} / {{ result.samples }} 次采样；{{
            result.document.duration
          }}
          秒，
          {{ result.document.objects[0]?.keys.length }}
          个可编辑关键帧。应用后请检查脚底、转体与遮挡部位
        </span>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <ElButton @click="modalApi.close()">取 消</ElButton>
        <ElButton
          :disabled="!source || running"
          :loading="running"
          class="!ml-0"
          @click="handleCapture"
        >
          解析动作
        </ElButton>
        <ElButton
          type="primary"
          :disabled="!result || running"
          class="!ml-0"
          @click="handleApply"
        >
          应用为导演工程
        </ElButton>
      </div>
    </template>
  </Modal>
</template>
