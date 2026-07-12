<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Alert, Form, FormItem, Input, message, Upload } from 'antdv-next';

import { importModel } from '#/api/bpm/model';

const emit = defineEmits(['success']);

const file = ref<File>();
const fileList = ref<any[]>([]);
const formRef = ref();
const formData = reactive({ key: '', name: '' });

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!file.value) {
      message.warning('请上传流程模型文件');
      return;
    }
    await formRef.value?.validate();
    modalApi.lock();
    try {
      await importModel(file.value, formData.key, formData.name);
      await modalApi.close();
      emit('success');
      message.success('导入成功');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) resetForm();
  },
});

async function beforeUpload(uploadFile: File) {
  if (!uploadFile.name.toLowerCase().endsWith('.json')) {
    message.error('仅支持上传 JSON 格式的流程模型文件');
    return Upload.LIST_IGNORE;
  }
  try {
    const data = JSON.parse(await uploadFile.text());
    file.value = uploadFile;
    formData.key = data.key || '';
    formData.name = data.name || '';
    return false;
  } catch {
    file.value = undefined;
    fileList.value = [];
    message.error('JSON 文件格式不正确');
    return Upload.LIST_IGNORE;
  }
}

function resetForm() {
  file.value = undefined;
  fileList.value = [];
  formData.key = '';
  formData.name = '';
  formRef.value?.clearValidate();
}
</script>

<template>
  <Modal title="导入流程模型" class="w-[640px]">
    <div class="mx-4 my-2">
      <Alert
        class="!mb-4"
        description="导入会完整保留流程配置，并将新模型归属到当前租户。请确认人员、部门、表单、子流程等关联在当前租户有效后再发布。"
        message="导入说明"
        show-icon
        type="info"
      />
      <Form ref="formRef" :model="formData">
        <FormItem label="流程模型文件">
          <Upload.Dragger
            v-model:file-list="fileList"
            :before-upload="beforeUpload"
            :max-count="1"
            accept=".json"
            @remove="file = undefined"
          >
            <p class="ant-upload-drag-icon flex justify-center">
              <IconifyIcon class="text-3xl" icon="lucide:cloud-upload" />
            </p>
            <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
            <p class="ant-upload-hint">仅支持单个 JSON 流程模型文件</p>
          </Upload.Dragger>
        </FormItem>
        <FormItem
          label="流程标识"
          name="key"
          :rules="[{ required: true, message: '请输入流程标识' }]"
        >
          <Input v-model:value="formData.key" placeholder="请输入流程标识" />
        </FormItem>
        <FormItem
          label="流程名称"
          name="name"
          :rules="[{ required: true, message: '请输入流程名称' }]"
        >
          <Input v-model:value="formData.name" placeholder="请输入流程名称" />
        </FormItem>
      </Form>
    </div>
  </Modal>
</template>
