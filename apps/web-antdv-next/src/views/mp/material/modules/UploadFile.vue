<script lang="ts" setup>
import type { UploadProps } from 'antdv-next';

import type { UploadData } from './upload';

import { reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, message, Upload } from 'antdv-next';

import {
  beforeImageUpload,
  beforeVoiceUpload,
  HEADERS,
  UPLOAD_URL,
  UploadType,
} from './upload';

const props = defineProps<{
  accountId: number;
  type: UploadType;
}>();

const emit = defineEmits<{
  uploaded: [];
}>();

const fileList = ref<any[]>([]);
const uploadData: UploadData = reactive({
  introduction: '',
  title: '',
  type: props.type,
});

/** 上传前检查 */
const onBeforeUpload =
  props.type === UploadType.Image ? beforeImageUpload : beforeVoiceUpload;

/** 自定义上传 */
const customRequest: UploadProps['customRequest'] = async function (options) {
  const { file, onError, onSuccess } = options;

  const formData = new FormData();
  formData.append('file', file as File);
  formData.append('type', uploadData.type);
  formData.append('title', uploadData.title);
  formData.append('introduction', uploadData.introduction);
  formData.append('accountId', String(props.accountId));

  try {
    const response = await fetch(UPLOAD_URL, {
      body: formData,
      headers: HEADERS.value,
      method: 'POST',
    });

    const res = await response.json();

    if (res?.code !== 0) {
      fileList.value = [];
      message.error(`上传出错：${res?.msg || '上传失败'}`);
      onError?.(new Error(res?.msg || '上传失败'));
      return;
    }

    // 清空上传时的各种数据
    fileList.value = [];
    uploadData.title = '';
    uploadData.introduction = '';

    message.success('上传成功');
    onSuccess?.(res);
    emit('uploaded');
  } catch (error: any) {
    fileList.value = [];
    message.error(`上传失败: ${error?.message || '请重试'}`);
    onError?.(error);
  }
};
</script>

<template>
  <Upload
    :action="UPLOAD_URL"
    :before-upload="onBeforeUpload"
    :custom-request="customRequest"
    :file-list="fileList"
    :headers="HEADERS"
    :multiple="true"
  >
    <Button type="primary">
      <IconifyIcon icon="lucide:upload" class="mr-1" />
      点击上传
    </Button>
    <template #itemRender="{ file, actions }">
      <div class="flex items-center">
        <span>{{ file.name }}</span>
        <Button type="link" size="small" @click="actions.remove"> 删除 </Button>
      </div>
    </template>
  </Upload>
  <div v-if="$slots.default" class="ml-1 text-sm text-gray-500">
    <slot></slot>
  </div>
</template>
