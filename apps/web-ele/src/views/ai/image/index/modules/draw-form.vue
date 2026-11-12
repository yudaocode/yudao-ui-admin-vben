<script lang="ts" setup>
import type { AiImageApi } from '#/api/ai/image';
import type { AiModelModelApi } from '#/api/ai/model/model';
import type { ImageModelCapability } from '#/views/ai/image/constants';

import { computed, ref } from 'vue';

import { AiImageInputRoleEnum, ImageHotWords } from '@vben/constants';

import {
  ElAlert,
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTag,
} from 'element-plus';

import { drawImage, optimizePrompt } from '#/api/ai/image';
import { ImageUpload } from '#/components/upload';
import { getSizeRatio, parseSize } from '#/views/ai/image/constants';

/** AI 绘图：通用模型、Seedream 的创作表单（字段按模型能力常量显示） */
defineOptions({ name: 'AiImageDrawForm' });

const props = defineProps<{
  capability: ImageModelCapability;
  model: AiModelModelApi.Model;
}>();
const emit = defineEmits<{
  submitted: [];
}>();

const NEGATIVE_PROMPT_MAX = 2000; // 与 AiImageDrawReqVO.negativePrompt 上限一致

/** 表单的初始值：取模型能力的第一项、高级参数的默认值 */
function buildInitialFormData() {
  const data: Record<string, any> = {
    prompt: '',
    negativePrompt: '',
    referenceImageUrls: [] as string[],
    size: props.capability.sizes?.[0],
    width: undefined as number | undefined,
    height: undefined as number | undefined,
    sizeLevel: props.capability.tiers?.[0],
    quality: props.capability.qualities?.[0],
  };
  props.capability.advanced?.forEach((field) => {
    data[field.key] = field.default;
  });
  if (data.size > 0) {
    Object.assign(data, parseSize(data.size));
  }
  return data;
}
const formData = ref<Record<string, any>>(buildInitialFormData());
const customSize = ref(false); // 是否自定义宽高
const uploadKey = ref(0); // 回填时重建参考图上传组件，避免上一次未完成的上传写入新表单

const acceptText = computed(() =>
  (props.capability.reference.accept || []).join(' / '),
);

function getChipClass(active: boolean) {
  return active
    ? 'border-primary bg-primary/5'
    : 'border-border hover:border-primary';
}

function getRatioText(size: string) {
  const { width, height } = parseSize(size);
  return getSizeRatio(width, height);
}

/** 参考图：单张上传时组件返回字符串，统一为数组 */
function getReferenceImageUrls(): string[] {
  const value: string | string[] = formData.value.referenceImageUrls;
  if (!value) {
    return [];
  }
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

/** 选择尺寸 */
function handleSizeClick(size: string) {
  customSize.value = false;
  formData.value.size = size;
  Object.assign(formData.value, parseSize(size));
}

/** 随机热词 */
function handleRandomHotWord() {
  formData.value.prompt =
    ImageHotWords[Math.floor(Math.random() * ImageHotWords.length)];
}

/** 生成专业绘画指令 */
const optimizing = ref(false);
async function handleOptimizePrompt() {
  if (!formData.value.prompt?.trim()) {
    ElMessage.warning('请先输入画面描述');
    return;
  }
  optimizing.value = true;
  try {
    const prompt = await optimizePrompt(formData.value.prompt);
    formData.value.prompt = prompt.slice(0, props.capability.promptMax);
  } finally {
    optimizing.value = false;
  }
}

/** 提交 */
const submitting = ref(false);
async function handleSubmit() {
  const data = formData.value;
  if (!data.prompt?.trim()) {
    ElMessage.warning('请输入画面描述');
    return;
  }
  if (customSize.value && (!data.width || !data.height)) {
    ElMessage.warning('请输入宽高');
    return;
  }
  const capability = props.capability;
  const isTier = capability.sizeMode === 'tier';
  const reqVO: AiImageApi.ImageDrawReqVO = {
    modelId: props.model.id,
    prompt: data.prompt,
    negativePrompt: capability.negativePrompt
      ? data.negativePrompt || undefined
      : undefined,
    referenceImageUrls:
      capability.reference.max > 0 ? getReferenceImageUrls() : undefined,
    width: isTier ? undefined : data.width,
    height: isTier ? undefined : data.height,
    sizeLevel: isTier ? data.sizeLevel : undefined,
    aspectRatio: isTier ? undefined : getSizeRatio(data.width, data.height),
    quality: capability.qualities?.length ? data.quality : undefined,
  };
  capability.advanced?.forEach((field) => {
    const value = data[field.key];
    (reqVO as Record<string, any>)[field.key] =
      value === '' || value === null ? undefined : value;
  });
  submitting.value = true;
  try {
    await drawImage(reqVO);
    ElMessage.success('已提交，生成结果见右侧我的作品');
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

/** 重新生成：回填参数；不在当前模型能力内的值不回填 */
function setValues(image: AiImageApi.Image) {
  const capability = props.capability;
  const data = buildInitialFormData();
  uploadKey.value++;
  data.prompt = image.prompt;
  if (capability.negativePrompt) {
    data.negativePrompt = image.negativePrompt || '';
  }
  if (capability.reference.max > 0) {
    data.referenceImageUrls = (image.inputImages || [])
      .filter((item) => item.role === AiImageInputRoleEnum.REFERENCE)
      .map((item) => item.url)
      .slice(0, capability.reference.max);
  }
  if (capability.sizeMode === 'tier') {
    const size = image.seedreamOptions?.size;
    if (size && capability.tiers?.includes(size)) {
      data.sizeLevel = size;
    }
  } else if (image.width && image.height) {
    const size = `${image.width}x${image.height}`;
    if (capability.sizes?.includes(size)) {
      data.size = size;
      Object.assign(data, { width: image.width, height: image.height });
      customSize.value = false;
    } else if (capability.custom) {
      Object.assign(data, {
        size: undefined,
        width: image.width,
        height: image.height,
      });
      customSize.value = true;
    }
  }
  const options = image.options || {};
  if (options.quality && capability.qualities?.includes(options.quality)) {
    data.quality = options.quality;
  }
  capability.advanced?.forEach((field) => {
    if (options[field.key] !== undefined && options[field.key] !== null) {
      data[field.key] = options[field.key];
    }
  });
  formData.value = data;
}

defineExpose({ setValues });
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- 参数区单独滚动；生成按钮在下方独占一行 -->
    <ElForm label-position="top" class="min-h-0 flex-1 overflow-y-auto pr-1">
      <ElAlert
        v-if="capability.status?.legacy"
        :title="capability.status.legacy"
        type="warning"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <!-- 提示词 -->
      <ElFormItem label="画面描述">
        <ElInput
          v-model="formData.prompt"
          type="textarea"
          :rows="5"
          :maxlength="capability.promptMax"
          show-word-limit
          placeholder="例如：童话里的小屋应该是什么样子？"
        />
        <div class="mt-2 flex w-full flex-wrap items-center gap-1.5">
          <ElButton
            size="small"
            type="primary"
            plain
            :loading="optimizing"
            @click="handleOptimizePrompt"
          >
            生成专业绘画指令
          </ElButton>
          <ElButton size="small" class="!ml-0" @click="handleRandomHotWord">
            随机热词
          </ElButton>
          <ElTag
            v-for="hotWord in ImageHotWords"
            :key="hotWord"
            type="info"
            class="cursor-pointer"
            @click="formData.prompt = hotWord"
          >
            {{ hotWord }}
          </ElTag>
        </div>
      </ElFormItem>
      <!-- 不希望出现的内容 -->
      <ElFormItem v-if="capability.negativePrompt" label="不希望出现的内容">
        <ElInput
          v-model="formData.negativePrompt"
          type="textarea"
          :rows="2"
          :maxlength="NEGATIVE_PROMPT_MAX"
          show-word-limit
          placeholder="例如：文字、水印、模糊"
        />
      </ElFormItem>
      <!-- 参考图 -->
      <ElFormItem
        v-if="capability.reference.max > 0"
        :label="`参考图（最多 ${capability.reference.max} 张）`"
      >
        <ImageUpload
          :key="uploadKey"
          v-model="formData.referenceImageUrls"
          :max-number="capability.reference.max"
          :max-size="capability.reference.maxMb"
          :accept="capability.reference.accept"
          :show-description="false"
          directory="ai/image"
          multiple
        />
        <div class="w-full text-xs leading-[18px] text-gray-500">
          单张 ≤ {{ capability.reference.maxMb }} MB，{{ acceptText }}
        </div>
      </ElFormItem>
      <!-- 尺寸：固定尺寸 / 像素宽高 -->
      <ElFormItem v-if="capability.sizeMode !== 'tier'" label="尺寸">
        <div class="grid w-full grid-cols-3 gap-2">
          <div
            v-for="size in capability.sizes"
            :key="size"
            class="flex cursor-pointer flex-col items-center gap-0.5 rounded-md border border-solid px-1 py-2 leading-[18px]"
            :class="getChipClass(!customSize && formData.size === size)"
            @click="handleSizeClick(size)"
          >
            <span class="font-bold">{{ getRatioText(size) }}</span>
            <span class="text-xs text-gray-500">{{ size }}</span>
          </div>
          <div
            v-if="capability.custom"
            class="flex cursor-pointer flex-col items-center gap-0.5 rounded-md border border-solid px-1 py-2 leading-[18px]"
            :class="getChipClass(customSize)"
            @click="customSize = true"
          >
            <span class="font-bold">自定义</span>
            <span class="text-xs text-gray-500">
              {{ capability.custom.min }}–{{ capability.custom.max }}
            </span>
          </div>
        </div>
        <div
          v-if="customSize && capability.custom"
          class="mt-2 flex w-full items-center gap-2"
        >
          <ElInputNumber
            v-model="formData.width"
            :min="capability.custom.min"
            :max="capability.custom.max"
            :step="capability.custom.step"
            step-strictly
            controls-position="right"
            class="!w-[140px]"
          />
          <span>×</span>
          <ElInputNumber
            v-model="formData.height"
            :min="capability.custom.min"
            :max="capability.custom.max"
            :step="capability.custom.step"
            step-strictly
            controls-position="right"
            class="!w-[140px]"
          />
          <span class="text-xs text-gray-500">
            {{ capability.custom.step }} 的倍数
          </span>
        </div>
      </ElFormItem>
      <!-- 尺寸：档位（Seedream） -->
      <ElFormItem v-else label="尺寸档位">
        <ElRadioGroup v-model="formData.sizeLevel">
          <ElRadioButton
            v-for="tier in capability.tiers"
            :key="tier"
            :value="tier"
          >
            {{ tier }}
          </ElRadioButton>
        </ElRadioGroup>
        <div class="mt-1 w-full text-xs leading-[18px] text-gray-500">
          按档位提交，画面比例请在描述中说明
        </div>
      </ElFormItem>
      <!-- 画质 -->
      <ElFormItem v-if="capability.qualities?.length" label="画质">
        <ElRadioGroup v-model="formData.quality">
          <ElRadioButton
            v-for="quality in capability.qualities"
            :key="quality"
            :value="quality"
          >
            {{ quality }}
          </ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>
      <!-- 高级参数、固定参数 -->
      <ElCollapse
        v-if="capability.advanced?.length || capability.fixed?.length"
        class="mb-4"
      >
        <ElCollapseItem
          v-if="capability.advanced?.length"
          name="advanced"
          title="高级参数"
        >
          <div class="grid grid-cols-2 gap-x-3">
            <ElFormItem
              v-for="field in capability.advanced"
              :key="field.key"
              :label="field.label"
            >
              <ElSelect
                v-if="field.type === 'select'"
                v-model="formData[field.key]"
                class="!w-full"
              >
                <ElOption
                  v-for="option in field.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
              <ElInputNumber
                v-else
                v-model="formData[field.key]"
                :min="field.min"
                :max="field.max"
                :step="field.step || 1"
                :placeholder="field.placeholder"
                controls-position="right"
                class="!w-full"
              />
            </ElFormItem>
          </div>
        </ElCollapseItem>
        <ElCollapseItem
          v-if="capability.fixed?.length"
          name="fixed"
          title="固定参数与写法建议"
        >
          <ElDescriptions :column="1" size="small" border>
            <ElDescriptionsItem
              v-for="item in capability.fixed"
              :key="item.name"
              :label="item.name"
            >
              {{ item.value }}
              <span class="text-xs text-gray-500">（{{ item.note }}）</span>
            </ElDescriptionsItem>
          </ElDescriptions>
          <ul class="mb-0 mt-2 pl-[18px] text-xs leading-5 text-gray-500">
            <li v-for="item in capability.guide" :key="item">{{ item }}</li>
          </ul>
        </ElCollapseItem>
      </ElCollapse>
    </ElForm>
    <!-- 生成按钮：在参数区下方独占一行，不随参数滚动 -->
    <div class="flex-shrink-0 pt-3">
      <ElButton
        type="primary"
        size="large"
        class="w-full"
        :loading="submitting"
        @click="handleSubmit"
      >
        生成图片
      </ElButton>
    </div>
  </div>
</template>
