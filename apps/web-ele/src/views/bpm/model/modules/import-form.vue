<script lang="ts" setup>
import type { UploadFile, UploadUserFile } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElAlert,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElUpload,
} from 'element-plus';

import { importModel } from '#/api/bpm/model';

const emit = defineEmits(['success']);

const file = ref<File>();
const fileList = ref<UploadUserFile[]>([]);
const formRef = ref<InstanceType<typeof ElForm>>();
const formData = reactive({ key: '', name: '' });

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!file.value) {
      ElMessage.warning('请上传流程模型文件');
      return;
    }
    await formRef.value?.validate();
    modalApi.lock();
    try {
      await importModel(file.value, formData.key, formData.name);
      await modalApi.close();
      emit('success');
      ElMessage.success('导入成功');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) resetForm();
  },
});

async function handleChange(uploadFile: UploadFile) {
  if (!uploadFile.raw) return;
  if (!uploadFile.name.toLowerCase().endsWith('.json')) {
    ElMessage.error('仅支持上传 JSON 格式的流程模型文件');
    resetFile();
    return;
  }
  try {
    const data = JSON.parse(await uploadFile.raw.text());
    file.value = uploadFile.raw;
    formData.key = data.key || '';
    formData.name = data.name || '';
  } catch {
    resetFile();
    ElMessage.error('JSON 文件格式不正确');
  }
}

function resetFile() {
  file.value = undefined;
  fileList.value = [];
}

function resetForm() {
  resetFile();
  formData.key = '';
  formData.name = '';
  formRef.value?.clearValidate();
}
</script>

<template>
  <Modal title="导入流程模型" class="w-[640px]">
    <div class="mx-4 my-2">
      <ElAlert
        class="!mb-4"
        description="导入会完整保留流程配置，并将新模型归属到当前租户。请确认人员、部门、表单、子流程等关联在当前租户有效后再发布。"
        show-icon
        title="导入说明"
        type="info"
      />
      <ElForm ref="formRef" :model="formData" label-width="100px">
        <ElFormItem label="流程模型文件">
          <ElUpload
            v-model:file-list="fileList"
            :auto-upload="false"
            :limit="1"
            accept=".json"
            drag
            @change="handleChange"
            @remove="resetFile"
          >
            <IconifyIcon class="mb-2 text-3xl" icon="lucide:cloud-upload" />
            <div>点击或拖拽 JSON 流程模型文件到此处</div>
          </ElUpload>
        </ElFormItem>
        <ElFormItem
          label="流程标识"
          prop="key"
          :rules="[{ required: true, message: '请输入流程标识' }]"
        >
          <ElInput v-model="formData.key" placeholder="请输入流程标识" />
        </ElFormItem>
        <ElFormItem
          label="流程名称"
          prop="name"
          :rules="[{ required: true, message: '请输入流程名称' }]"
        >
          <ElInput v-model="formData.name" placeholder="请输入流程名称" />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
