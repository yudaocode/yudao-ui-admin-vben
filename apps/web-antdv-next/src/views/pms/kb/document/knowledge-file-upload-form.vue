<script lang="ts" setup>
import type { PmsKnowledgeDocumentApi } from '#/api/pms/kb/content/document';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createKnowledgeDocument } from '#/api/pms/kb/content/document';
import {
  PmsKnowledgeDocumentType,
  PmsKnowledgeRootId,
} from '#/views/pms/kb/utils/constants';

import { useUploadFormSchema } from './data';

defineOptions({ name: 'PmsKnowledgeFileUploadForm' });

// TODO @AI：对齐 system user 导入表单：文件走 schema Upload slot。补 destroyOnClose。打开方式不要 defineExpose。

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

/** 获得文件文档上传表单默认数据 */
function getDefaultFormData() {
  return {
    libraryId: 0,
    folderId: PmsKnowledgeRootId,
    parentId: PmsKnowledgeRootId,
    title: '',
    type: PmsKnowledgeDocumentType.FILE as number,
    content: '',
    fileType: undefined as string | undefined,
    fileSize: undefined as number | undefined,
  };
}

/** 文件上传完成后，用文件地址填充名称和扩展名 */
async function handleFileChange(value: string) {
  if (!value) {
    return;
  }
  const fileName = decodeURIComponent(
    value.split('?')[0]!.split('/').pop() || '',
  );
  const fileType = fileName.includes('.')
    ? fileName.split('.').pop()?.toLowerCase()
    : undefined;
  const values = await formApi.getValues();
  await formApi.setValues({
    fileType,
    title: values.title || fileName.replace(/\.[^.]+$/, '') || fileName,
  });
  // 上传完成后清除文件与名称的必填校验提示
  formApi.clearValidation(['content', 'title']);
}

/** 文件上传完成后保存文件大小元数据 */
function handleFileSizeChange(value?: number) {
  formApi.setValues({ fileSize: value });
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  wrapperClass: 'grid-cols-1',
  layout: 'horizontal',
  schema: useUploadFormSchema({
    onFileChange: handleFileChange,
    onFileSizeChange: handleFileSizeChange,
  }),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[560px]',
  async onConfirm() {
    // 1. 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 2. 创建文件类型文档
    modalApi.lock();
    try {
      const data =
        (await formApi.getValues()) as PmsKnowledgeDocumentApi.KnowledgeDocumentCreateReq;
      await createKnowledgeDocument(data);
      message.success('上传成功');
      // 3. 关闭弹窗并通知父组件刷新
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as {
      folderId: number;
      libraryId: number;
      parentId: number;
    };
    // 重置表单并将文件归入当前目录
    formApi.setValues({
      ...getDefaultFormData(),
      libraryId: data.libraryId,
      folderId: data.folderId,
      parentId: data.parentId,
    });
    formApi.clearValidation();
  },
});

/** 打开上传弹窗，并将文件归入当前目录 */
defineExpose({
  open: (
    libraryId: number,
    folderId = PmsKnowledgeRootId,
    parentId = PmsKnowledgeRootId,
  ) => {
    modalApi.setData({ libraryId, folderId, parentId }).open();
  },
});
</script>

<template>
  <Modal title="上传文件">
    <Form class="mx-4" />
  </Modal>
</template>
