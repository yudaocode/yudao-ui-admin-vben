<script lang="ts" setup>
import type { UploadProps } from 'element-plus';

import type { UploadData } from './upload';

import { inject, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { ElButton, ElMessage, ElUpload } from 'element-plus';

import {
  beforeImageUpload,
  beforeVoiceUpload,
  HEADERS,
  UPLOAD_URL,
  UploadType,
} from './upload';

const props = defineProps<{ type: UploadType }>();

const emit = defineEmits<{
  uploaded: [v: void];
}>();

const accountId = inject<number>('accountId');

const fileList = ref<any[]>([]);
const uploadData: UploadData = reactive({
  accountId: accountId!,
  introduction: '',
  title: '',
  type: props.type,
});

/** 上传前检查 */
const onBeforeUpload =
  props.type === UploadType.Image ? beforeImageUpload : beforeVoiceUpload;

/** 自定义上传 */
const customRequest: UploadProps['httpRequest'] = async function (options) {
  const { file, onError, onSuccess } = options;

  const formData = new FormData();
  formData.append('file', file as File);
  formData.append('type', uploadData.type);
  formData.append('title', uploadData.title);
  formData.append('introduction', uploadData.introduction);
  formData.append('accountId', String(uploadData.accountId));

  try {
    const response = await fetch(UPLOAD_URL, {
      body: formData,
      headers: HEADERS,
      method: 'POST',
    });

    const res = await response.json();

    if (res.code !== 0) {
      ElMessage.error(`上传出错：${res.msg}`);
      const error = new Error(res.msg) as any;
      error.status = 200;
      error.method = 'POST';
      error.url = UPLOAD_URL;
      onError?.(error);
      return;
    }

    // 清空上传时的各种数据
    fileList.value = [];
    uploadData.title = '';
    uploadData.introduction = '';

    ElMessage.success('上传成功');
    onSuccess?.(res);
    emit('uploaded');
  } catch (error: any) {
    ElMessage.error(`上传失败: ${error.message}`);
    onError?.(error);
  }
};
</script>

<template>
  <ElUpload
    :action="UPLOAD_URL"
    :before-upload="onBeforeUpload"
    :http-request="customRequest"
    :file-list="fileList"
    :headers="HEADERS"
    :multiple="true"
  >
    <ElButton type="primary">
      <IconifyIcon icon="lucide:upload" class="mr-1" />
      点击上传
    </ElButton>
    <template #file="{ file }">
      <div class="flex items-center">
        <span>{{ file.name }}</span>
        <ElButton type="primary" link size="small" @click="fileList = []">
          删除
        </ElButton>
      </div>
    </template>
  </ElUpload>
  <div v-if="$slots.default" class="ml-1 text-sm text-gray-500">
    <slot></slot>
  </div>
</template>
