<script lang="ts" setup>
import type { DirectorDocument } from '../director';

import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { computed, onBeforeUnmount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Alert,
  Button,
  Form,
  FormItem,
  InputNumber,
  message,
  Progress,
  RadioButton,
  RadioGroup,
  Select,
  Upload,
} from 'ant-design-vue';

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
    message.warning('视频不能超过 200MB');
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
    message.error(error instanceof Error ? error.message : '动作解析失败');
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
    <Alert
      type="info"
      show-icon
      class="mb-3"
      message="选择单人视频，在浏览器中识别关节动作，生成可编辑的白模关键帧。遮挡、转身和近景中看不到的肢体需手动修正。"
    />
    <Form :label-col="{ flex: '90px' }" :wrapper-col="{ flex: 'auto' }">
      <FormItem label="视频来源">
        <RadioGroup
          v-model:value="sourceType"
          option-type="button"
          :disabled="running"
        >
          <RadioButton value="local">本地视频</RadioButton>
          <RadioButton value="project">项目中的视频</RadioButton>
        </RadioGroup>
      </FormItem>
      <FormItem v-if="sourceType === 'local'" label="本地视频">
        <div class="flex items-center">
          <Upload
            :show-upload-list="false"
            accept="video/*"
            :disabled="running"
            :before-upload="handleBeforeUpload"
          >
            <Button :disabled="running">选择视频</Button>
          </Upload>
          <span class="text-muted-foreground ml-2 truncate text-xs">
            {{ fileName || '不超过 200MB，只在本机读取' }}
          </span>
        </div>
      </FormItem>
      <FormItem v-else label="项目视频">
        <Select
          v-model:value="projectVideoUrl"
          :options="projectVideos"
          placeholder="动作参考或已完成的镜头视频"
          show-search
          option-filter-prop="label"
          class="w-full"
          :disabled="running"
          @change="handleProjectVideoChange"
        />
      </FormItem>
      <FormItem v-if="source" label="预览">
        <video
          :src="source"
          controls
          preload="metadata"
          class="max-h-[220px] w-full rounded bg-black"
          :crossorigin="sourceType === 'project' ? 'anonymous' : undefined"
        ></video>
      </FormItem>
      <FormItem label="区间（秒）">
        <div class="flex items-center">
          <InputNumber
            v-model:value="start"
            :min="0"
            :step="0.1"
            :precision="1"
            :disabled="running"
          />
          <span class="mx-2">至</span>
          <InputNumber
            v-model:value="end"
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
      </FormItem>
      <FormItem v-if="running" label="进度">
        <div class="flex items-center">
          <Progress :percent="Math.round(progress * 100)" class="flex-1" />
          <Button type="link" class="ml-2" @click="controller?.abort()">
            取消
          </Button>
        </div>
      </FormItem>
      <FormItem v-if="result" label="结果">
        <span class="text-[13px]">
          已识别 {{ result.detected }} / {{ result.samples }} 次采样；{{
            result.document.duration
          }}
          秒，
          {{ result.document.objects[0]?.keys.length }}
          个可编辑关键帧。应用后请检查脚底、转体与遮挡部位
        </span>
      </FormItem>
    </Form>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <Button @click="modalApi.close()">取 消</Button>
        <Button
          :disabled="!source || running"
          :loading="running"
          @click="handleCapture"
        >
          解析动作
        </Button>
        <Button
          type="primary"
          :disabled="!result || running"
          @click="handleApply"
        >
          应用为导演工程
        </Button>
      </div>
    </template>
  </Modal>
</template>
