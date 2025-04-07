<script lang="ts" setup>
import type { InfraFileApi } from '#/api/infra/file';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { computed, ref } from 'vue';
import { useVbenForm } from '#/adapter/form';
import { uploadFile } from '#/api/infra/file';
import { $t } from '#/locales';

const emit = defineEmits(['success']);
const fileList = ref<any[]>([]);
const uploadData = ref({ path: '' });

// 表单内容
const formSchema = [
  {
    fieldName: 'file',
    component: 'Upload',
    label: '文件上传',
    componentProps: {
      fileList: fileList.value,
      name: 'file',
      maxCount: 1,
      accept: '.jpg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx',
      beforeUpload: (file: File) => {
        uploadData.value.path = file.name;
        return false; // 阻止自动上传
      },
      onChange: ({ fileList }: any) => {
        fileList.value = fileList;
      },
    },
    rules: 'required',
  },
];

// 表单实例
const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: formSchema,
  showDefaultActions: false,
});

// 模态框实例
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    if (fileList.value.length === 0) {
      message.error('请上传文件');
      return;
    }

    modalApi.lock();
    // 提交表单
    try {
      const formData = new FormData();
      formData.append('file', fileList.value[0].originFileObj);
      formData.append('path', uploadData.value.path);

      await uploadFile(formData);

      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.uploadSuccess'),
        key: 'action_process_msg',
      });
    } finally {
      modalApi.lock(false);
      fileList.value = [];
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 重置表单
    fileList.value = [];
    uploadData.value = { path: '' };
  },
});

const getTitle = computed(() => $t('ui.actionTitle.upload', ['文件']));
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
