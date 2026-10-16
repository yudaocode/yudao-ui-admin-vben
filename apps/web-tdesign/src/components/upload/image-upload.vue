<script lang="ts" setup>
import type { UploadFile, UploadProps } from 'tdesign-vue-next';

import type { FileUploadProps } from './typing';

import { computed, ref, toRefs, watch } from 'vue';

import { $t } from '@vben/locales';
import {
  defaultImageAccepts,
  isFunction,
  isImage,
  isNumber,
  isObject,
  isString,
} from '@vben/utils';

import { Upload } from 'tdesign-vue-next';

import { message } from '#/adapter/tdesign';

import { UploadResultStatus } from './typing';
import { useUpload, useUploadType } from './use-upload';

defineOptions({ name: 'ImageUpload', inheritAttrs: false });

const props = withDefaults(defineProps<FileUploadProps>(), {
  value: () => [],
  modelValue: undefined,
  directory: undefined,
  disabled: false,
  listType: 'picture-card',
  helpText: '',
  maxSize: 2,
  maxNumber: 1,
  accept: () => defaultImageAccepts,
  multiple: false,
  api: undefined,
  resultField: '',
  showDescription: true,
});
const emit = defineEmits([
  'change',
  'update:value',
  'update:modelValue',
  'delete',
]);
const { accept, helpText, maxNumber, maxSize } = toRefs(props);
const isInnerOperate = ref<boolean>(false);
const { getStringAccept } = useUploadType({
  acceptRef: accept,
  helpTextRef: helpText,
  maxNumberRef: maxNumber,
  maxSizeRef: maxSize,
});

// 计算当前绑定的值，优先使用 modelValue
const currentValue = computed(() => {
  return props.modelValue === undefined ? props.value : props.modelValue;
});

// 判断是否使用 modelValue
const isUsingModelValue = computed(() => {
  return props.modelValue !== undefined;
});
// TDesign 的 multiple 同时决定文件列表是否追加，多文件数量时需要开启
const isMultiple = computed(() => props.multiple || props.maxNumber > 1);

const fileList = ref<UploadProps['files']>([]);
const isLtMsg = ref<boolean>(true); // 文件大小错误提示
const isActMsg = ref<boolean>(true); // 文件类型错误提示
const isFirstRender = ref<boolean>(true); // 是否第一次渲染

watch(
  currentValue,
  async (v) => {
    if (isInnerOperate.value) {
      isInnerOperate.value = false;
      return;
    }
    let value: string | string[] = [];
    if (v) {
      if (Array.isArray(v)) {
        value = v;
      } else {
        value.push(v);
      }
      fileList.value = value.map((item, i) => {
        if (item && isString(item)) {
          return {
            uid: `${-i}`,
            name: item.slice(Math.max(0, item.lastIndexOf('/') + 1)),
            status: UploadResultStatus.SUCCESS,
            url: item,
          };
        } else if (item && isObject(item)) {
          return item;
        }
        return null;
      }) as UploadProps['files'];
    }
    if (!isFirstRender.value) {
      emit('change', value);
      isFirstRender.value = false;
    }
  },
  {
    immediate: true,
    deep: true,
  },
);

// TDesign 已先从 files 中移除该文件，这里只同步绑定值
function handleRemove({ file }: { file?: UploadFile }) {
  const value = getValue();
  isInnerOperate.value = true;
  emit('update:value', value);
  emit('update:modelValue', value);
  emit('change', value);
  emit('delete', file);
}

// 处理文件数量超限
function handleValidate({ type }: { type: string }) {
  if (type === 'FILES_OVER_LENGTH_LIMIT') {
    message.error($t('ui.upload.maxNumber', [maxNumber.value]));
  }
}

async function beforeUpload(file: UploadFile) {
  // 检查文件数量限制
  if (
    isNumber(fileList.value!.length) &&
    fileList.value!.length >= props.maxNumber
  ) {
    message.error($t('ui.upload.maxNumber', [props.maxNumber]));
    return false;
  }

  const { maxSize, accept } = props;
  const isAct = isImage(file.raw!.name, accept);
  if (!isAct) {
    message.error($t('ui.upload.acceptUpload', [accept]));
    isActMsg.value = false;
    // 防止弹出多个错误提示
    setTimeout(() => (isActMsg.value = true), 1000);
    return false;
  }
  const isLt = file.size! / 1024 / 1024 > maxSize;
  if (isLt) {
    message.error($t('ui.upload.maxSizeMultiple', [maxSize]));
    isLtMsg.value = false;
    // 防止弹出多个错误提示
    setTimeout(() => (isLtMsg.value = true), 1000);
    return false;
  }
  return true;
}

async function customRequest(info: UploadFile | UploadFile[]) {
  // 处理单个文件上传
  const uploadFile = Array.isArray(info) ? info[0] : info;

  if (!uploadFile) {
    return {
      status: 'fail' as const,
      error: 'No file provided',
      response: {},
    };
  }

  let { api } = props;
  if (!api || !isFunction(api)) {
    api = useUpload(props.directory).httpRequest;
  }
  try {
    // 上传文件（进度由 TDesign 的上传进度展示）
    const res = await api?.(uploadFile.raw!);
    message.success($t('ui.upload.uploadSuccess'));

    // 提取 URL，兼容不同的返回格式
    const fileUrl = (res as any)?.url || (res as any)?.data || res;

    return {
      status: 'success' as const,
      response: {
        url: fileUrl,
        // 保留 api 原始响应，供 resultField 场景按原契约输出
        rawResponse: res,
      },
    };
  } catch (error: any) {
    handleUploadError(error);
    return {
      status: 'fail' as const,
      error: error instanceof Error ? error.message : 'Upload failed',
      response: {},
    };
  }
}

// 处理上传成功：TDesign 已把上传结果写回 files
function handleUploadSuccess() {
  const value = getValue();
  isInnerOperate.value = true;
  emit('update:value', value);
  emit('update:modelValue', value);
  emit('change', value);
}

// 处理上传错误
function handleUploadError(error: any) {
  console.error('上传错误:', error);
}

function getValue() {
  const list = (fileList.value || [])
    .filter((item) => item?.status === UploadResultStatus.SUCCESS)
    .map((item: any) => {
      // TDesign 的 response 是展示用包装，原始 api 响应在 rawResponse 中
      if (item?.response && props?.resultField) {
        return item?.response?.rawResponse;
      }
      return item?.url || item?.response?.url || item?.response?.rawResponse;
    });

  // 单个文件的情况，根据输入参数类型决定返回格式
  if (props.maxNumber === 1) {
    const singleValue = list.length > 0 ? list[0] : '';
    // 如果原始值是字符串或 modelValue 是字符串，返回字符串
    if (
      isString(props.value) ||
      (isUsingModelValue.value && isString(props.modelValue))
    ) {
      return singleValue;
    }
    return singleValue;
  }

  // 多文件情况，根据输入参数类型决定返回格式
  if (isUsingModelValue.value) {
    return Array.isArray(props.modelValue) ? list : list.join(',');
  }

  return Array.isArray(props.value) ? list : list.join(',');
}
</script>

<template>
  <div>
    <Upload
      v-bind="$attrs"
      v-model:files="fileList"
      :accept="getStringAccept"
      :before-upload="beforeUpload"
      :request-method="customRequest"
      :disabled="disabled"
      :theme="listType === 'picture-card' ? 'image' : 'image-flow'"
      :max="maxNumber"
      :multiple="isMultiple"
      allow-upload-duplicate-file
      @remove="handleRemove"
      @success="handleUploadSuccess"
      @validate="handleValidate"
    />
    <div
      v-if="showDescription"
      class="mt-2 flex flex-wrap items-center text-sm"
    >
      请上传不超过
      <div class="mx-1 font-bold text-primary">{{ maxSize }}MB</div>
      的
      <div class="mx-1 font-bold text-primary">{{ accept.join('/') }}</div>
      格式文件
    </div>
  </div>
</template>

<style scoped>
/* TDesign 上传组件样式 */
:deep(.t-upload__card-item) {
  @apply flex items-center justify-center;
}
</style>
