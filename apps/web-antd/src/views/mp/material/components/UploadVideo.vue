<script lang="ts" setup>
import type { FormInstance, UploadProps } from 'ant-design-vue';

import type { UploadData } from './upload';

import { inject, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { message, Modal, Upload } from 'ant-design-vue';

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
  introduction: [{ message: '请输入描述', required: true, trigger: 'blur' }],
  title: [{ message: '请输入标题', required: true, trigger: 'blur' }],
};

const handleCancel = () => {
  emit('update:open', false);
};

const fileList = ref<any[]>([]);

const uploadData: UploadData = reactive({
  accountId: accountId!,
  introduction: '',
  title: '',
  type: UploadType.Video,
});

const uploadFormRef = ref<FormInstance | null>(null);
const uploadVideoRef = ref<any>(null);

const submitVideo = async () => {
  try {
    await uploadFormRef.value?.validate();
    uploadVideoRef.value?.submit();
  } catch {
    // Validation failed
  }
};

/** 自定义上传 */
const customRequest: UploadProps['customRequest'] = async (options) => {
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
      message.error(`上传出错：${res.msg}`);
      onError?.(new Error(res.msg));
      return;
    }

    // 清空上传时的各种数据
    fileList.value = [];
    uploadData.title = '';
    uploadData.introduction = '';

    emit('update:open', false);
    message.success('上传成功');
    onSuccess?.(res);
    emit('uploaded');
  } catch (error: any) {
    message.error(`上传失败: ${error.message}`);
    onError?.(error);
  }
};
</script>

<template>
  <Modal
    :open="open"
    title="新建视频"
    width="600px"
    @cancel="handleCancel"
    @ok="submitVideo"
  >
    <Upload
      ref="uploadVideoRef"
      :action="UPLOAD_URL"
      :auto-upload="false"
      :before-upload="beforeVideoUpload"
      :custom-request="customRequest"
      :file-list="fileList"
      :headers="HEADERS"
      :limit="1"
      :multiple="true"
      class="mb-4"
    >
      <a-button type="primary">
        <IconifyIcon icon="mdi:video-plus" class="mr-1" />
        选择视频
      </a-button>
    </Upload>
    <div class="mb-4 ml-1 text-sm text-gray-500">
      格式支持 MP4，文件大小不超过 10MB
    </div>

    <a-divider />

    <a-form
      ref="uploadFormRef"
      :model="uploadData"
      :rules="uploadRules"
      layout="vertical"
    >
      <a-form-item label="标题" name="title">
        <a-input
          v-model:value="uploadData.title"
          placeholder="标题将展示在相关播放页面，建议填写清晰、准确、生动的标题"
        />
      </a-form-item>
      <a-form-item label="描述" name="introduction">
        <a-textarea
          v-model:value="uploadData.introduction"
          :rows="3"
          placeholder="介绍语将展示在相关播放页面，建议填写简洁明确、有信息量的内容"
        />
      </a-form-item>
    </a-form>
  </Modal>
</template>
