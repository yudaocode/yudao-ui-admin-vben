<script lang="ts" setup>
import type { WmsItemApi } from '#/api/wms/md/item';

// TODO @AI：参考 style user form 的注释风格

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createItem, getItem, updateItem } from '#/api/wms/md/item';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import SkuForm from './sku-form.vue';

defineOptions({ name: 'WmsItemForm' });

const emit = defineEmits(['success']);
const formData = ref<WmsItemApi.Item>();
const skuFormRef = ref<any>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['商品'])
    : $t('ui.actionTitle.create', ['商品']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 88,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

/** 表单 schema 需要 formApi 引用，所以通过 setState 设置 schema */
formApi.setState({ schema: useFormSchema(formApi) });

async function resetSkuForm(item?: WmsItemApi.Item) {
  await nextTick();
  await skuFormRef.value?.setRows(item?.skus);
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    try {
      skuFormRef.value?.validate();
    } catch (error) {
      message.warning((error as Error).message);
      return;
    }
    modalApi.lock();
    const data = (await formApi.getValues()) as WmsItemApi.Item;
    data.skus = skuFormRef.value?.getRows() || [];
    try {
      await (formData.value?.id ? updateItem(data) : createItem(data));
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
    await formApi.resetForm();
    await resetSkuForm();
    const data = modalApi.getData<WmsItemApi.Item>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getItem(data.id);
      await formApi.setValues(formData.value);
      await resetSkuForm(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/4">
    <Form class="mx-4" />
    <SkuForm ref="skuFormRef" class="mx-4 mt-4" />
  </Modal>
</template>
