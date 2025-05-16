<script lang="ts" setup>
// TODO @xingyu：文件上传，貌似没通
import type { UploadFile, UploadProps } from 'naive-ui';
import type { UploadRequestOption } from 'naive-ui/lib/vc-upload/interface';

import type { AxiosResponse } from '@vben/request';

import type { AxiosProgressEvent } from '#/api/infra/file';

import { ref, toRefs, watch } from 'vue';

import { CloudUpload } from '@vben/icons';
import { $t } from '@vben/locales';
import { isFunction, isObject, isString } from '@vben/utils';

import { NButton, NUpload } from 'naive-ui';

import { message } from '#/adapter/naive';

import { checkFileType } from './helper';
import { UploadResultStatus } from './typing';
import { useUpload, useUploadType } from './use-upload';

defineOptions({ name: 'FileUpload', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    // 根据后缀，或者其他
    accept?: string[];
    api?: (
      file: File,
      onUploadProgress?: AxiosProgressEvent,
    ) => Promise<AxiosResponse<any>>;
    // 上传的目录
    directory?: string;
    disabled?: boolean;
    helpText?: string;
    // 最大数量的文件，Infinity不限制
    maxNumber?: number;
    // 文件最大多少MB
    maxSize?: number;
    // 是否支持多选
    multiple?: boolean;
    // support xxx.xxx.xx
    resultField?: string;
    // 是否显示下面的描述
    showDescription?: boolean;
    value?: string | string[];
  }>(),
  {
    value: () => [],
    directory: undefined,
    disabled: false,
    helpText: '',
    maxSize: 2,
    maxNumber: 1,
    accept: () => [],
    multiple: false,
    api: undefined,
    resultField: '',
    showDescription: false,
  },
);
const emit = defineEmits(['change', 'update:value', 'delete']);
const { accept, helpText, maxNumber, maxSize } = toRefs(props);
const isInnerOperate = ref<boolean>(false);
const { getStringAccept } = useUploadType({
  acceptRef: accept,
  helpTextRef: helpText,
  maxNumberRef: maxNumber,
  maxSizeRef: maxSize,
});

const fileList = ref<UploadProps['fileList']>([]);
const isLtMsg = ref<boolean>(true); // 文件大小错误提示
const isActMsg = ref<boolean>(true); // 文件类型错误提示
const isFirstRender = ref<boolean>(true); // 是否第一次渲染

watch(
  () => props.value,
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
      fileList.value = value.map((item, i) => {
        if (item && isString(item)) {
          return {
            uid: `${-i}`,
            name: item.slice(Math.max(0, item.lastIndexOf('/') + 1)),
            status: UploadResultStatus.DONE,
            url: item,
          };
        } else if (item && isObject(item)) {
          return item;
        }
        return null;
      }) as UploadProps['fileList'];
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

const handleRemove = async (file: UploadFile) => {
  if (fileList.value) {
    const index = fileList.value.findIndex((item) => item.uid === file.uid);
    index !== -1 && fileList.value.splice(index, 1);
    const value = getValue();
    isInnerOperate.value = true;
    emit('update:value', value);
    emit('change', value);
    emit('delete', file);
  }
};

const beforeUpload = async (file: File) => {
  const { maxSize, accept } = props;
  const isAct = checkFileType(file, accept);
  if (!isAct) {
    message.error($t('ui.upload.acceptUpload', [accept]));
    isActMsg.value = false;
    // 防止弹出多个错误提示
    setTimeout(() => (isActMsg.value = true), 1000);
  }
  const isLt = file.size / 1024 / 1024 > maxSize;
  if (isLt) {
    message.error($t('ui.upload.maxSizeMultiple', [maxSize]));
    isLtMsg.value = false;
    // 防止弹出多个错误提示
    setTimeout(() => (isLtMsg.value = true), 1000);
  }
  return (isAct && !isLt) || Upload.LIST_IGNORE;
};

async function customRequest(info: UploadRequestOption<any>) {
  let { api } = props;
  if (!api || !isFunction(api)) {
    api = useUpload(props.directory).httpRequest;
  }
  try {
    // 上传文件
    const progressEvent: AxiosProgressEvent = (e) => {
      const percent = Math.trunc((e.loaded / e.total!) * 100);
      info.onProgress!({ percent });
    };
    const res = await api?.(info.file as File, progressEvent);
    info.onSuccess!(res);
    message.success($t('ui.upload.uploadSuccess'));

    // 更新文件
    const value = getValue();
    isInnerOperate.value = true;
    emit('update:value', value);
    emit('change', value);
  } catch (error: any) {
    console.error(error);
    info.onError!(error);
  }
}

function getValue() {
  const list = (fileList.value || [])
    .filter((item) => item?.status === UploadResultStatus.DONE)
    .map((item: any) => {
      if (item?.response && props?.resultField) {
        return item?.response;
      }
      return item?.url || item?.response?.url || item?.response;
    });
  // add by 芋艿：【特殊】单个文件的情况，获取首个元素，保证返回的是 String 类型
  if (props.maxNumber === 1) {
    return list.length > 0 ? list[0] : '';
  }
  return list;
}
</script>

<template>
  <div>
    <NUpload
      v-bind="$attrs"
      v-model:file-list="fileList"
      :accept="getStringAccept"
      :before-upload="beforeUpload"
      :custom-request="customRequest"
      :disabled="disabled"
      :max-count="maxNumber"
      :multiple="multiple"
      list-type="text"
      :progress="{ showInfo: true }"
      @remove="handleRemove"
    >
      <div v-if="fileList && fileList.length < maxNumber">
        <NButton>
          <CloudUpload />
          {{ $t('ui.upload.upload') }}
        </NButton>
      </div>
      <div v-if="showDescription" class="mt-2 flex flex-wrap items-center">
        请上传不超过
        <div class="text-primary mx-1 font-bold">{{ maxSize }}MB</div>
        的
        <div class="text-primary mx-1 font-bold">{{ accept.join('/') }}</div>
        格式文件
      </div>
    </NUpload>
  </div>
</template>
