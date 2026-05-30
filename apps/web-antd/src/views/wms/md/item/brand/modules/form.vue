<script lang="ts" setup>
import type { WmsItemBrandApi } from '#/api/wms/md/item/brand';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createItemBrand,
  getItemBrand,
  updateItemBrand,
} from '#/api/wms/md/item/brand';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'WmsItemBrandForm' });

const emit = defineEmits(['success']);
const formData = ref<WmsItemBrandApi.ItemBrand>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['商品品牌'])
    : $t('ui.actionTitle.create', ['商品品牌']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = (await formApi.getValues()) as WmsItemBrandApi.ItemBrand;
    try {
      await (formData.value?.id
        ? updateItemBrand(data)
        : createItemBrand(data));
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
    formApi.setState({ schema: useFormSchema(formApi) });
    const data = modalApi.getData<WmsItemBrandApi.ItemBrand>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getItemBrand(data.id);
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
