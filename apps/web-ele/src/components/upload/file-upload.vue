<script lang="ts" setup>
import type {
  UploadFile,
  UploadProgressEvent,
  UploadRequestOptions,
} from 'element-plus';

import type { FileUploadProps } from './typing';

import type { AxiosProgressEvent } from '#/api/infra/file';

import { computed, ref, toRefs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { checkFileType, isFunction, isObject, isString } from '@vben/utils';

import { ElButton, ElMessage, ElUpload } from 'element-plus';

import { UploadResultStatus } from './typing';
import { useUpload, useUploadType } from './use-upload';

defineOptions({ name: 'FileUpload', inheritAttrs: false });

const props = withDefaults(defineProps<FileUploadProps>(), {
  value: () => [],
  modelValue: undefined,
  directory: undefined,
  disabled: false,
  drag: false,
  helpText: '',
  maxSize: 2,
  maxNumber: 1,
  accept: () => [],
  multiple: false,
  api: undefined,
  resultField: '',
  showDescription: false,
});
const emit = defineEmits([
  'change',
  'update:value',
  'update:modelValue',
  'delete',
  'returnText',
  'preview',
]);
const { accept, helpText, maxNumber, maxSize } = toRefs(props);
const isInnerOperate = ref<boolean>(false);
const { getStringAccept } = useUploadType({
  acceptRef: accept,
  helpTextRef: helpText,
  maxNumberRef: maxNumber,
  maxSizeRef: maxSize,
});

/** 计算当前绑定的值，优先使用 modelValue */
const currentValue = computed(() => {
  return props.modelValue === undefined ? props.value : props.modelValue;
});

/** 判断是否使用 modelValue */
const isUsingModelValue = computed(() => {
  return props.modelValue !== undefined;
});

const fileList = ref<UploadFile[]>([]);
const isLtMsg = ref<boolean>(true); // 文件大小错误提示
const isActMsg = ref<boolean>(true); // 文件类型错误提示
const isFirstRender = ref<boolean>(true); // 是否第一次渲染
const uploadNumber = ref<number>(0); // 上传文件计数器
const uploadList = ref<any[]>([]); // 临时上传列表

watch(
  currentValue,
  (v) => {
    if (isInnerOperate.value) {
      isInnerOperate.value = false;
      return;
    }
    let value: string[] = [];
    if (v) {
      if (Array.isArray(v)) {
        value = v;
      } else {
        value.push(v);
      }
      fileList.value = value
        .map((item, i) => {
          if (item && isString(item)) {
            return {
              uid: -i,
              name: item.slice(Math.max(0, item.lastIndexOf('/') + 1)),
              status: UploadResultStatus.SUCCESS,
              url: item,
            } as UploadFile;
          } else if (item && isObject(item)) {
            const file = item as unknown as Record<string, any>;
            return {
              uid: file.uid ?? -i,
              name: file.name ?? '',
              status: file.status ?? UploadResultStatus.SUCCESS,
              url: file.url,
            } as UploadFile;
          }
          return null;
        })
        .filter(Boolean) as UploadFile[];
    } else {
      // 值为空时清空文件列表
      fileList.value = [];
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

/** 处理文件删除 */
function handleRemove(file: UploadFile) {
  if (fileList.value) {
    const index = fileList.value.findIndex((item) => item.uid === file.uid);
    index !== -1 && fileList.value.splice(index, 1);
    const value = getValue();
    isInnerOperate.value = true;
    emit('update:value', value);
    emit('update:modelValue', value);
    emit('change', value);
    emit('delete', file);
  }
}

/** 处理文件预览 */
function handlePreview(file: UploadFile) {
  emit('preview', file);
  if (file.url) {
    window.open(file.url);
  }
}

/** 处理文件数量超限 */
function handleExceed() {
  ElMessage.error($t('ui.upload.maxNumber', [maxNumber.value]));
}

/** 处理上传错误 */
function handleUploadError(error: any) {
  console.error('上传错误:', error);
  ElMessage.error($t('ui.upload.uploadError'));
  // 上传失败时减少计数器
  uploadNumber.value = Math.max(0, uploadNumber.value - 1);
}

/**
 * 上传前校验
 * @param file 待上传的文件
 * @returns 是否允许上传
 */
/* eslint-disable unicorn/no-nested-ternary */
async function beforeUpload(file: File) {
  const fileContent = await file.text();
  emit('returnText', fileContent);

  // 检查文件数量限制（使用 getValue 获取实际已上传的文件数量）
  const currentFiles = getValue();
  const currentCount = Array.isArray(currentFiles)
    ? currentFiles.length
    : currentFiles
      ? 1
      : 0;
  if (currentCount >= props.maxNumber) {
    ElMessage.error($t('ui.upload.maxNumber', [props.maxNumber]));
    return false;
  }

  const { maxSize, accept } = props;
  const isAct = checkFileType(file, accept);
  if (!isAct) {
    ElMessage.error($t('ui.upload.acceptUpload', [accept]));
    isActMsg.value = false;
    // 防止弹出多个错误提示
    setTimeout(() => (isActMsg.value = true), 1000);
    return false;
  }
  const isLt = file.size / 1024 / 1024 > maxSize;
  if (isLt) {
    ElMessage.error($t('ui.upload.maxSizeMultiple', [maxSize]));
    isLtMsg.value = false;
    // 防止弹出多个错误提示
    setTimeout(() => (isLtMsg.value = true), 1000);
    return false;
  }

  // 只有在验证通过后才增加计数器
  uploadNumber.value++;
  return true;
}

/** 自定义上传请求 */
async function customRequest(options: UploadRequestOptions) {
  let { api } = props;
  if (!api || !isFunction(api)) {
    api = useUpload(props.directory).httpRequest;
  }
  try {
    // 上传文件
    const progressEvent: AxiosProgressEvent = (e) => {
      const percent = Math.trunc((e.loaded / e.total!) * 100);
      options.onProgress!({
        percent,
        total: e.total || 0,
        loaded: e.loaded || 0,
        lengthComputable: true,
      } as unknown as UploadProgressEvent);
    };
    const res = await api?.(options.file, progressEvent);

    // 处理上传成功后的逻辑
    handleUploadSuccess(res, options.file as File);

    options.onSuccess!(res);
    ElMessage.success($t('ui.upload.uploadSuccess'));
  } catch (error: any) {
    console.error(error);
    options.onError!(error);
    handleUploadError(error);
  }
}

/**
 * 处理上传成功
 * @param res 上传响应结果
 * @param file 上传的文件
 */
function handleUploadSuccess(res: any, file: File) {
  // 删除临时文件
  const index = fileList.value?.findIndex((item) => item.name === file.name);
  if (index !== -1) {
    fileList.value?.splice(index!, 1);
  }

  // 添加到临时上传列表
  const fileUrl = res?.url || res?.data || res;
  uploadList.value.push({
    name: file.name,
    url: fileUrl,
    status: UploadResultStatus.SUCCESS,
    uid: file.name + Date.now(),
  });

  // 检查是否所有文件都上传完成
  if (uploadList.value.length >= uploadNumber.value) {
    fileList.value?.push(...uploadList.value);
    uploadList.value = [];
    uploadNumber.value = 0;

    // 更新值
    const value = getValue();
    isInnerOperate.value = true;
    emit('update:value', value);
    emit('update:modelValue', value);
    emit('change', value);
  }
}

/**
 * 获取当前文件列表的值
 * @returns 文件 URL 列表或字符串
 */
function getValue() {
  const list = (fileList.value || [])
    .filter((item) => item?.status === UploadResultStatus.SUCCESS)
    .map((item: any) => {
      if (item?.response && props?.resultField) {
        return item?.response;
      }
      return item?.url || item?.response?.url || item?.response;
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
    <ElUpload
      v-bind="$attrs"
      v-model:file-list="fileList"
      :accept="getStringAccept"
      :before-upload="beforeUpload"
      :http-request="customRequest"
      :disabled="disabled"
      :limit="maxNumber"
      :multiple="multiple"
      :drag="drag"
      list-type="text"
      :on-remove="handleRemove"
      :on-preview="handlePreview"
      :on-exceed="handleExceed"
    >
      <template v-if="drag">
        <div class="upload-drag-area">
          <p class="upload-drag-icon">
            <IconifyIcon icon="lucide:cloud-upload" :size="48" />
          </p>
          <p class="upload-drag-text">点击或拖拽文件到此区域上传</p>
          <p class="upload-drag-hint">
            支持{{ accept.join('/') }}格式文件，不超过{{ maxSize }}MB
          </p>
        </div>
      </template>
      <template v-else>
        <ElButton v-if="fileList && fileList.length < maxNumber" type="primary">
          <IconifyIcon icon="lucide:cloud-upload" class="mr-1" />
          {{ $t('ui.upload.upload') }}
        </ElButton>
      </template>
    </ElUpload>
    <div
      v-if="showDescription && !drag"
      class="mt-2 flex flex-wrap items-center text-sm"
    >
      请上传不超过
      <span class="mx-1 font-bold text-primary">{{ maxSize }}MB</span>
      的
      <span class="mx-1 font-bold text-primary">{{ accept.join('/') }}</span>
      格式文件
    </div>
  </div>
</template>

<style scoped>
.upload-drag-area {
  padding: 20px;
  text-align: center;
  background-color: #fafafa;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.upload-drag-area:hover {
  border-color: var(--el-color-primary);
}

.upload-drag-icon {
  margin-bottom: 16px;
  color: #d9d9d9;
}

.upload-drag-text {
  margin-bottom: 8px;
  font-size: 16px;
  color: #666;
}

.upload-drag-hint {
  font-size: 14px;
  color: #999;
}
</style>
