<script lang="ts" setup>
import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { createKnowledgeDocument } from '#/api/pms/kb/content/document';
import {
  PmsKnowledgeDocumentType,
  PmsKnowledgeRootId,
} from '#/views/pms/kb/utils/constants';

import { useFormSchema } from './data';

defineOptions({ name: 'PmsKnowledgeDocumentCreateForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const data = modalApi.getData() as {
      folderId: number;
      libraryId: number;
      parentId: number;
    };
    const values = await formApi.getValues();
    modalApi.lock();
    try {
      await createKnowledgeDocument({
        libraryId: data.libraryId,
        folderId: data.folderId,
        parentId: data.parentId,
        title: values.title,
        type: PmsKnowledgeDocumentType.RICH_TEXT,
      });
      message.success('创建成功');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    await formApi.setValues({ title: '' });
  },
});

/** 打开弹窗（由父页面通过 setData 传入目录上下文） */
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
  <Modal title="新建文档" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
