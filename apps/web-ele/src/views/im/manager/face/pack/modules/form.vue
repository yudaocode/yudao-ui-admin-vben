<script lang="ts" setup>
import type { ImManagerFacePackApi } from '#/api/im/manager/face/pack';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus'

import { useVbenForm } from '#/adapter/form';
import {
  createManagerFacePack,
  getManagerFacePack,
  updateManagerFacePack,
} from '#/api/im/manager/face/pack';
import { $t } from '#/locales';

import { usePackFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<ImManagerFacePackApi.FacePack>();
const getTitle = computed(() => {
  return formData.value?.id ? '修改表情包' : '新增表情包';
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: usePackFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = (await formApi.getValues()) as ImManagerFacePackApi.FacePack;
    try {
      await (formData.value?.id
        ? updateManagerFacePack(data)
        : createManagerFacePack(data));
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
    const data = modalApi.getData<ImManagerFacePackApi.FacePack>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getManagerFacePack(data.id);
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/3">
    <Form class="mx-4" />
  </Modal>
</template>
