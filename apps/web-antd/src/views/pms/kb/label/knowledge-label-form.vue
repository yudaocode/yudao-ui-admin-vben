<script lang="ts" setup>
import type { PmsKnowledgeDocumentLabelApi } from '#/api/pms/kb/content/document/label';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createKnowledgeDocumentLabel,
  getKnowledgeDocumentLabel,
  updateKnowledgeDocumentLabel,
} from '#/api/pms/kb/content/document/label';
import { $t } from '#/locales';

import { useLabelFormSchema } from './data';

defineOptions({ name: 'PmsKnowledgeLabelForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const formData = ref<PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel>();

const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['标签'])
    : $t('ui.actionTitle.create', ['标签']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useLabelFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const values = await formApi.getValues();
    const data: PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel = {
      id: formData.value?.id ?? (undefined as unknown as number),
      name: values.name,
      color: values.color,
    };
    try {
      await (formData.value?.id
        ? updateKnowledgeDocumentLabel(data)
        : createKnowledgeDocumentLabel(data));
      await modalApi.close();
      emit('success');
      message.success(formData.value?.id ? '更新成功' : '创建成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    const data = modalApi.getData() as undefined | { id?: number };
    if (!data?.id) {
      formData.value = undefined;
      await formApi.setValues({ name: '', color: '#409EFF' });
      return;
    }
    formData.value = await getKnowledgeDocumentLabel(data.id);
    await formApi.setValues(formData.value);
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[460px]">
    <Form class="mx-4" />
  </Modal>
</template>
