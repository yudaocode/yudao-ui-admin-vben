<script lang="ts" setup>
import type { MesWmProductReceiptLineApi } from '#/api/mes/wm/productreceipt/line';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createProductReceiptLine,
  getProductReceiptLine,
  updateProductReceiptLine,
} from '#/api/mes/wm/productreceipt/line';
import { $t } from '#/locales';

import { useLineFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmProductReceiptLineApi.ProductReceiptLine>();
const receiptId = ref<number>(); // 所属入库单编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['物料入库单行'])
    : $t('ui.actionTitle.create', ['物料入库单行']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
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
      (await formApi.getValues()) as MesWmProductReceiptLineApi.ProductReceiptLine;
    data.receiptId = receiptId.value;
    try {
      await (formData.value?.id
        ? updateProductReceiptLine({ ...data, id: formData.value.id })
        : createProductReceiptLine(data));
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
    formApi.setState({ schema: useLineFormSchema(formApi) });
    // 加载数据
    const data = modalApi.getData<{ id?: number; receiptId: number }>();
    receiptId.value = data.receiptId;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getProductReceiptLine(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
  </Modal>
</template>
