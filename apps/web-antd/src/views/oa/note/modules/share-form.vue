<script lang="ts" setup>
import type { OaNoteApi } from '#/api/oa/note';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getNote, updateNoteShare } from '#/api/oa/note';
import { $t } from '#/locales';

import { useShareFormSchema } from '../data';

const emit = defineEmits(['success']);
const noteId = ref<number>(); // 笔记编号

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useShareFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || noteId.value === undefined) {
      return;
    }
    modalApi.lock();
    // 仅提交接收人，避免覆盖笔记正文和其他字段
    const data = (await formApi.getValues()) as OaNoteApi.Note;
    try {
      await updateNoteShare(noteId.value, data.receiverUserIds || []);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      noteId.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      // 获取最新共享关系，不使用列表中的旧接收人
      const note = await getNote(data.id);
      noteId.value = data.id;
      await formApi.setValues({
        title: note.title,
        receiverUserIds: note.receiverUserIds || [],
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="共享笔记" class="w-1/3">
    <Form class="mx-4" />
    <div class="mx-4 -mt-2 text-xs text-muted-foreground">
      清空接收人后保存，将取消这篇笔记的全部共享。
    </div>
  </Modal>
</template>
