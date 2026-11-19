<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { computed, ref, watch } from 'vue';

import {
  AiDramaAudioTypeEnum,
  AiDramaStatusEnum,
  isAiDramaRunning,
} from '@vben/constants';

import {
  Button,
  Checkbox,
  CheckboxGroup,
  Col,
  Collapse,
  CollapsePanel,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  RadioButton,
  RadioGroup,
  Row,
  Select,
} from 'antdv-next';

import { createDramaAudio } from '#/api/ai/drama/asset';
import { composeDramaProject } from '#/api/ai/drama/project';
import { FileUpload } from '#/components/upload';
import {
  DRAMA_ASPECT_RATIOS,
  DRAMA_TRANSITION_NONE,
  DRAMA_TRANSITIONS,
} from '#/views/ai/utils/drama';

import AudioGenerateForm from '../asset/audio-generate-form.vue';

/** AI 短剧：合成设置，选择镜头、转场、画幅、旁白、水印；成片条内嵌，合成成片弹窗共用 */
defineOptions({ name: 'AiDramaComposePanel' });

const props = defineProps<{
  detail: AiDramaProjectApi.ProjectDetail;
  hint?: string; // 提交按钮旁的提示，例如「合成输入已变更」
}>();
/** success：已提交合成；refresh：旁白有新增，需要刷新详情 */
const emit = defineEmits<{ refresh: []; success: [] }>();

const labelCol = { flex: '70px' };
const wrapperCol = { flex: 'auto' };

const formLoading = ref(false); // 表单的加载中：提交的按钮禁用
const uploadAudioUrl = ref(''); // 待保存的上传旁白
const uploadKey = ref(0); // 上传组件的重建标记：保存、重置后清空已选文件
const formData = ref<Omit<AiDramaProjectApi.ComposeReq, 'projectId'>>({
  storyboardIds: [],
  aspectRatio: '9:16',
  transitionType: DRAMA_TRANSITION_NONE,
  transitionDuration: 0.5,
  narrationAudioId: undefined,
  watermarkText: '',
});

/** 视频已完成的镜头 */
const successStoryboards = computed(() =>
  props.detail.storyboards.filter(
    (item) => item.videoStatus === AiDramaStatusEnum.SUCCESS && item.videoUrl,
  ),
);
/** 拼接顺序：指定时按指定的镜头顺序，只含其中的镜头；否则按镜头顺序 */
const playOrder = ref<number[]>();
const orderedStoryboards = computed(() =>
  playOrder.value
    ? playOrder.value
        .map((id) => successStoryboards.value.find((item) => item.id === id)!)
        .filter(Boolean)
    : successStoryboards.value,
);
const narrations = computed(() =>
  props.detail.audios.filter(
    (item) => item.type === AiDramaAudioTypeEnum.NARRATION,
  ),
);
const narrationOptions = computed(() =>
  narrations.value.map((item, index) => ({
    label: `旁白 ${index + 1}`,
    value: item.id,
  })),
);
const aspectRatioOptions = DRAMA_ASPECT_RATIOS.map((item) => ({
  label: item,
  value: item,
}));
const narrationUrl = computed(
  () =>
    narrations.value.find((item) => item.id === formData.value.narrationAudioId)
      ?.fileUrl,
);
/** 旁白默认文本：剧情大纲 */
const narrationText = computed(
  () => props.detail.script?.outline?.slice(0, 2000) || '',
);

/** 重置：默认选中当前版本里视频已完成的镜头；转场、画幅取上次合成的设置 */
function reset(storyboardIds?: number[]) {
  const project = props.detail.project;
  playOrder.value = storyboardIds;
  formData.value = {
    storyboardIds: orderedStoryboards.value.map((item) => item.id),
    aspectRatio: project.composeAspectRatio || '9:16',
    transitionType: project.composeTransitionType ?? DRAMA_TRANSITION_NONE,
    transitionDuration: project.composeTransitionDurationSeconds || 0.5,
    narrationAudioId: undefined,
    watermarkText: '',
  };
  uploadAudioUrl.value = '';
  uploadKey.value++;
}

/** 刷新后：新完成的镜头补入选择；已不再完成的镜头移出；用户取消勾选的保持不选 */
watch(
  () => orderedStoryboards.value.map((item) => item.id),
  (ids, oldIds) => {
    const selectedIds = formData.value.storyboardIds;
    const added = ids.filter(
      (id) => !oldIds?.includes(id) && !selectedIds.includes(id),
    );
    formData.value.storyboardIds = [
      ...selectedIds.filter((id) => ids.includes(id)),
      ...added,
    ];
  },
);
defineExpose({ reset });

/** 全选、取消全选镜头 */
function handleCheckAll(checked: boolean) {
  formData.value.storyboardIds = checked
    ? orderedStoryboards.value.map((item) => item.id)
    : [];
}

/** 保存上传的旁白 */
async function handleUploadNarration() {
  await createDramaAudio({
    projectId: props.detail.project.id,
    type: AiDramaAudioTypeEnum.NARRATION,
    fileUrl: uploadAudioUrl.value,
  });
  uploadAudioUrl.value = '';
  uploadKey.value++;
  message.success('旁白已保存');
  emit('refresh');
}

/** 提交合成 */
async function submitForm() {
  formLoading.value = true;
  try {
    const { storyboardIds, transitionType, transitionDuration, watermarkText } =
      formData.value;
    const data: AiDramaProjectApi.ComposeReq = {
      ...formData.value,
      projectId: props.detail.project.id,
      // 按镜头顺序拼接，不按勾选顺序
      storyboardIds: orderedStoryboards.value
        .map((item) => item.id)
        .filter((id) => storyboardIds.includes(id)),
      // 无转场时不传时长；没有水印时不传
      transitionDuration:
        transitionType === DRAMA_TRANSITION_NONE
          ? undefined
          : transitionDuration,
      watermarkText: watermarkText || undefined,
    };
    await composeDramaProject(data);
    message.success('已开始合成，完成后自动刷新');
    emit('success');
  } finally {
    formLoading.value = false;
  }
}
</script>

<template>
  <Form :model="formData" :label-col="labelCol" :wrapper-col="wrapperCol">
    <FormItem label="镜头">
      <div class="w-full">
        <Checkbox
          :checked="
            orderedStoryboards.length > 0 &&
            formData.storyboardIds.length === orderedStoryboards.length
          "
          :indeterminate="
            formData.storyboardIds.length > 0 &&
            formData.storyboardIds.length < orderedStoryboards.length
          "
          @change="(e: any) => handleCheckAll(e.target.checked)"
        >
          全选（{{ playOrder ? '按指定的镜头顺序拼接' : '按镜头顺序拼接' }}）
        </Checkbox>
        <CheckboxGroup
          v-model:value="formData.storyboardIds"
          class="flex flex-wrap gap-x-3"
        >
          <Checkbox
            v-for="item in orderedStoryboards"
            :key="item.id"
            :value="item.id"
          >
            镜 {{ item.sceneNo }} {{ item.title || '未命名镜头' }}
            <span class="text-muted-foreground text-xs">
              （{{ item.duration || '-' }} 秒）
            </span>
          </Checkbox>
        </CheckboxGroup>
      </div>
    </FormItem>
    <FormItem label="转场">
      <div class="flex flex-wrap items-center gap-3">
        <RadioGroup
          v-model:value="formData.transitionType"
          button-style="solid"
        >
          <RadioButton
            v-for="item in DRAMA_TRANSITIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </RadioButton>
        </RadioGroup>
        <template v-if="formData.transitionType !== DRAMA_TRANSITION_NONE">
          <InputNumber
            v-model:value="formData.transitionDuration"
            :min="0.1"
            :max="2"
            :step="0.1"
            :precision="1"
            class="w-28"
          />
          <span class="text-xs">秒，需短于每个镜头</span>
        </template>
      </div>
    </FormItem>
    <Row :gutter="12">
      <Col :span="12">
        <FormItem label="画幅">
          <Select
            v-model:value="formData.aspectRatio"
            :options="aspectRatioOptions"
            class="w-full"
          />
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem label="水印">
          <Input
            v-model:value="formData.watermarkText"
            placeholder="可选，显示在右下角"
            :maxlength="32"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>
    <FormItem label="旁白">
      <div class="w-full">
        <Select
          v-model:value="formData.narrationAudioId"
          :options="narrationOptions"
          allow-clear
          placeholder="不使用旁白"
          class="w-full"
        />
        <audio
          v-if="narrationUrl"
          :src="narrationUrl"
          controls
          class="mt-1.5 h-8 w-full"
        ></audio>
        <Collapse class="mt-1.5">
          <CollapsePanel key="narration" header="上传或生成旁白">
            <div class="mb-2 flex items-start gap-2">
              <FileUpload
                :key="uploadKey"
                v-model:value="uploadAudioUrl"
                :accept="['mp3', 'wav', 'm4a']"
                :max-size="20"
                directory="ai/drama"
              />
              <Button :disabled="!uploadAudioUrl" @click="handleUploadNarration">
                保存上传的旁白
              </Button>
            </div>
            <AudioGenerateForm
              :project-id="detail.project.id"
              :default-text="narrationText"
              @success="emit('refresh')"
            />
          </CollapsePanel>
        </Collapse>
      </div>
    </FormItem>
    <div class="flex items-center justify-end gap-2">
      <span v-if="hint" class="text-warning text-xs">{{ hint }}</span>
      <span
        v-if="formData.storyboardIds.length < 2"
        class="text-muted-foreground text-xs"
      >
        至少选择 2 个视频已完成的镜头
      </span>
      <Button
        type="primary"
        :disabled="
          formData.storyboardIds.length < 2 ||
          isAiDramaRunning(detail.project.composeStatus)
        "
        :loading="formLoading"
        @click="submitForm"
      >
        合成所选 {{ formData.storyboardIds.length }} 段
      </Button>
    </div>
  </Form>
</template>
