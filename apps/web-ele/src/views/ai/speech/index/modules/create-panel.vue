<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { AiSpeechApi } from '#/api/ai/speech';
import type { SpeechModel } from '#/views/ai/utils/speech';

import { computed, reactive, ref, watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSkeleton,
  ElSlider,
} from 'element-plus';

import { generateSpeech } from '#/api/ai/speech';
import {
  getSpeechFormatLabel,
  getSpeechTextLength,
  SPEECH_TEXT_UNIT_GBK,
} from '#/views/ai/utils/speech';

/** AI 语音：合成面板 */
defineOptions({ name: 'AiSpeechCreatePanel' });

const props = defineProps<{
  modelLoading: boolean; // 模型加载中
  models: SpeechModel[]; // 可用的语音模型
}>();

const emit = defineEmits<{
  submitted: [id: number]; // 提交成功
}>();

const formRef = ref<FormInstance>(); // 表单 Ref
const submitting = ref(false);
const formData = reactive({
  modelId: undefined as number | undefined,
  inputText: '',
  voice: '',
  format: '',
  speed: 1 as number | undefined, // 语速：输入框清空时为 undefined，提交时按 1
});
const formRules: FormRules = {
  modelId: [{ required: true, message: '模型不能为空', trigger: 'change' }],
  inputText: [
    {
      required: true,
      whitespace: true,
      message: '朗读文本不能为空',
      trigger: 'blur',
    },
  ],
  voice: [
    {
      required: true,
      whitespace: true,
      message: '音色不能为空',
      trigger: 'change',
    },
    { max: 64, message: '音色不能超过 64 个字符', trigger: 'change' },
  ],
  format: [{ required: true, message: '音频格式不能为空', trigger: 'change' }],
};

const currentModel = computed(() =>
  props.models.find((item) => item.id === formData.modelId),
);
const minSpeed = computed(() => Number(currentModel.value?.minSpeed ?? 1));
const maxSpeed = computed(() => Number(currentModel.value?.maxSpeed ?? 1));
const speedFixed = computed(() => minSpeed.value === maxSpeed.value);
const textLength = computed(() =>
  getSpeechTextLength(formData.inputText, currentModel.value?.textUnit),
);
const textOverflow = computed(
  () =>
    !!currentModel.value && textLength.value > currentModel.value.maxTextLength,
);

/**
 * 切换模型：音色、格式不在新模型的可选范围时，换为默认值；语速超出范围时重置为 1（不在范围内时取最近的边界）
 *
 * @param keep 尽量保留的参数（再次生成时带入）
 */
function applyModel(keep?: {
  format?: string;
  speed?: number;
  voice?: string;
}) {
  const model = currentModel.value;
  if (!model) {
    return;
  }
  const voice = keep?.voice ?? formData.voice;
  const keepVoice =
    !!keep?.voice || model.voices.some((item) => item.value === voice);
  formData.voice = keepVoice ? voice : model.voices[0]?.value || '';
  const format = keep?.format ?? formData.format;
  formData.format = model.formats.includes(format)
    ? format
    : model.formats[0] || '';
  const speed = keep?.speed ?? formData.speed ?? 1;
  formData.speed = Math.min(Math.max(speed, minSpeed.value), maxSpeed.value);
}

function handleModelChange() {
  applyModel();
  formRef.value?.clearValidate();
}

/** 模型加载后：默认选中第一个；当前模型已不可用时也换为第一个 */
watch(
  () => props.models,
  (models) => {
    if (models.length > 0 && !currentModel.value) {
      formData.modelId = models[0]!.id;
      applyModel();
    }
  },
  { immediate: true },
);

/** 提交 */
async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (textOverflow.value) {
    ElMessage.warning('朗读文本超过模型的上限，请缩短后再试');
    return;
  }
  submitting.value = true;
  try {
    const id = await generateSpeech({
      modelId: formData.modelId!,
      inputText: formData.inputText,
      voice: formData.voice.trim(),
      format: formData.format,
      speed: speedFixed.value
        ? undefined
        : Number((formData.speed ?? 1).toFixed(2)),
    });
    ElMessage.success('已提交，生成完成后可在「我的语音」中播放');
    emit('submitted', id);
  } finally {
    submitting.value = false;
  }
}

/** 再次生成：带入文本、音色、格式、语速；原模型已不可用时保留当前模型 */
function fill(speech: AiSpeechApi.Speech) {
  const available = props.models.some((item) => item.id === speech.modelId);
  if (available) {
    formData.modelId = speech.modelId;
  } else {
    ElMessage.warning('原模型已不可用，已保留当前模型');
  }
  formData.inputText = speech.inputText;
  applyModel(
    available
      ? { voice: speech.voice, format: speech.format, speed: speech.speed }
      : undefined,
  );
  formRef.value?.clearValidate();
}

defineExpose({ fill });
</script>

<template>
  <div class="flex size-full flex-col rounded-lg bg-card p-4">
    <!-- 表单区域内部滚动，底部「生成语音」按钮固定可见 -->
    <div class="mb-3 text-base font-bold">语音合成</div>
    <ElSkeleton v-if="modelLoading" :rows="6" animated />
    <ElEmpty
      v-else-if="models.length === 0"
      description="暂无可用的语音模型，请在「AI 模型」中添加类型为「音频」的模型，并配置对应平台的密钥"
    />
    <ElForm
      v-else
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      class="min-h-0 flex-1 overflow-y-auto"
    >
      <ElFormItem label="模型" prop="modelId">
        <ElSelect
          v-model="formData.modelId"
          placeholder="请选择模型"
          @change="handleModelChange"
        >
          <ElOption
            v-for="item in models"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <span>{{ item.name }}</span>
            <span
              class="float-right text-xs text-[var(--el-text-color-secondary)]"
            >
              {{
                getDictLabel(DICT_TYPE.AI_PLATFORM, item.platform) ||
                item.platform
              }}
            </span>
          </ElOption>
        </ElSelect>
        <div
          v-if="currentModel?.async"
          class="mt-1 text-xs leading-[18px] text-[var(--el-text-color-secondary)]"
        >
          长文本异步合成：提交后排队生成，通常数分钟内完成，结果保留 24
          小时内可查询
        </div>
      </ElFormItem>

      <ElFormItem label="朗读文本" prop="inputText">
        <ElInput
          v-model="formData.inputText"
          type="textarea"
          :rows="8"
          resize="vertical"
          placeholder="请输入要朗读的文本"
        />
        <div
          class="mt-1 w-full text-right text-xs"
          :class="
            textOverflow
              ? 'text-[var(--el-color-danger)]'
              : 'text-[var(--el-text-color-secondary)]'
          "
        >
          {{ textLength }} / {{ currentModel?.maxTextLength ?? '-' }}
          {{
            currentModel?.textUnit === SPEECH_TEXT_UNIT_GBK
              ? 'GBK 字节（估算）'
              : '字'
          }}
        </div>
      </ElFormItem>

      <ElFormItem label="音色" prop="voice">
        <ElSelect
          v-model="formData.voice"
          filterable
          allow-create
          default-first-option
          placeholder="请选择或输入音色"
        >
          <ElOption
            v-for="item in currentModel?.voices || []"
            :key="item.value"
            :label="`${item.name}（${item.value}）`"
            :value="item.value"
          />
        </ElSelect>
        <div
          class="mt-1 text-xs leading-[18px] text-[var(--el-text-color-secondary)]"
        >
          可输入服务商的其它音色{{
            currentModel?.async ? '，腾讯云为数字 VoiceType' : ''
          }}
        </div>
      </ElFormItem>

      <ElFormItem label="音频格式" prop="format">
        <ElRadioGroup v-model="formData.format">
          <ElRadioButton
            v-for="item in currentModel?.formats || []"
            :key="item"
            :value="item"
          >
            {{ getSpeechFormatLabel(item) }}
          </ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="语速" prop="speed">
        <div class="flex w-full items-center gap-3">
          <!-- 固定语速（最小值等于最大值）时不渲染滑块，避免出现 NaN -->
          <div v-if="speedFixed" class="flex-1"></div>
          <ElSlider
            v-else
            v-model="formData.speed"
            :min="minSpeed"
            :max="maxSpeed"
            :step="0.1"
            :show-tooltip="false"
            class="flex-1"
          />
          <ElInputNumber
            v-model="formData.speed"
            :min="minSpeed"
            :max="maxSpeed"
            :step="0.1"
            :precision="2"
            :disabled="speedFixed"
            controls-position="right"
            class="!w-[110px]"
          />
        </div>
        <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
          {{
            speedFixed
              ? '该模型不支持调节语速'
              : `范围 ${minSpeed} ~ ${maxSpeed} 倍`
          }}
        </div>
      </ElFormItem>
    </ElForm>
    <ElButton
      v-if="!modelLoading && models.length > 0"
      type="primary"
      class="mt-3 w-full flex-shrink-0"
      :loading="submitting"
      :disabled="textOverflow"
      @click="handleSubmit"
    >
      <IconifyIcon icon="ep:microphone" class="mr-1" /> 生成语音
    </ElButton>
  </div>
</template>
