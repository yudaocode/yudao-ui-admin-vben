<script lang="ts" setup>
import type { OaNoteCategoryApi } from '#/api/oa/note/category';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createNoteCategory,
  getNoteCategory,
  updateNoteCategory,
} from '#/api/oa/note/category';
import { $t } from '#/locales';

import { useCategoryFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaNoteCategoryApi.NoteCategory>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['目录'])
    : $t('ui.actionTitle.create', ['目录']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useCategoryFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as OaNoteCategoryApi.NoteCategory;
    try {
      await (formData.value?.id
        ? updateNoteCategory(data)
        : createNoteCategory(data));
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
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id?: number };
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getNoteCategory(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/4">
    <Form class="mx-4" />
  </Modal>
</template>
