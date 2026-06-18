<script lang="ts" setup>
import type { ImManagerChannelMaterialVO } from '#/api/im/manager/channel/material';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createManagerChannelMaterial,
  getManagerChannelMaterial,
  updateManagerChannelMaterial,
} from '#/api/im/manager/channel/material';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<ImManagerChannelMaterialVO>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['素材'])
    : $t('ui.actionTitle.create', ['素材']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 100,
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
    modalApi.lock();
    const data =
      (await formApi.getValues()) as ImManagerChannelMaterialVO;
    try {
      await (formData.value?.id
        ? updateManagerChannelMaterial(data)
        : createManagerChannelMaterial(data));
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
      await formApi.resetForm();
      return;
    }
    const data = modalApi.getData<ImManagerChannelMaterialVO>();
    await formApi.setValues({ type: 1 });
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getManagerChannelMaterial(data.id);
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
  </Modal>
</template>
