<script lang="ts" setup>
import type { FormInstance, UploadProps } from 'element-plus';

import type { UploadData } from './upload';

import { inject, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElDialog,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElUpload,
} from 'element-plus';

import { beforeVideoUpload, HEADERS, UPLOAD_URL, UploadType } from './upload';

withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: false,
  },
);

const emit = defineEmits<{
  'update:open': [v: boolean];
  uploaded: [v: void];
}>();

const accountId = inject<number>('accountId');

const uploadRules = {
  introduction: [
    { message: '请输入描述', required: true, trigger: 'blur' } as const,
  ],
  title: [{ message: '请输入标题', required: true, trigger: 'blur' } as const],
};

function handleCancel() {
  emit('update:open', false);
}

const fileList = ref<any[]>([]);

const uploadData: UploadData = reactive({
  accountId: accountId!,
  introduction: '',
  title: '',
  type: UploadType.Video,
});

const uploadFormRef = ref<FormInstance | null>(null);
const uploadVideoRef = ref<any>(null);

async function submitVideo() {
  await uploadFormRef.value?.validate();
  uploadVideoRef.value?.submit();
}

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

    emit('update:open', false);
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
  <ElDialog
    :model-value="open"
    title="新建视频"
    width="600px"
    @close="handleCancel"
  >
    <template #footer>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton type="primary" @click="submitVideo">确定</ElButton>
    </template>
    <ElUpload
      ref="uploadVideoRef"
      :action="UPLOAD_URL"
      :auto-upload="false"
      :before-upload="beforeVideoUpload"
      :http-request="customRequest"
      :file-list="fileList"
      :headers="HEADERS"
      :limit="1"
      :multiple="true"
      class="mb-4"
    >
      <ElButton type="primary">
        <IconifyIcon icon="lucide:video" class="mr-1" />
        选择视频
      </ElButton>
    </ElUpload>
    <div class="mb-4 ml-1 text-sm text-gray-500">
      格式支持 MP4，文件大小不超过 10MB
    </div>

    <ElDivider />

    <ElForm
      ref="uploadFormRef"
      :model="uploadData"
      :rules="uploadRules"
      label-position="top"
    >
      <ElFormItem label="标题" prop="title">
        <ElInput
          v-model="uploadData.title"
          placeholder="标题将展示在相关播放页面，建议填写清晰、准确、生动的标题"
        />
      </ElFormItem>
      <ElFormItem label="描述" prop="introduction">
        <ElInput
          v-model="uploadData.introduction"
          type="textarea"
          :rows="3"
          placeholder="介绍语将展示在相关播放页面，建议填写简洁明确、有信息量的内容"
        />
      </ElFormItem>
    </ElForm>
  </ElDialog>
</template>
