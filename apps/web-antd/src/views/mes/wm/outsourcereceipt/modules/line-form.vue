<script lang="ts" setup>
import type { MesWmOutsourceReceiptLineApi } from '#/api/mes/wm/outsourcereceipt/line';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createOutsourceReceiptLine,
  getOutsourceReceiptLine,
  updateOutsourceReceiptLine,
} from '#/api/mes/wm/outsourcereceipt/line';
import { $t } from '#/locales';

import { useLineFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmOutsourceReceiptLineApi.OutsourceReceiptLine>();
const receiptId = ref<number>(); // 所属入库单编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['外协入库单行'])
    : $t('ui.actionTitle.create', ['外协入库单行']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: useLineFormSchema(),
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
    // 提交表单（批次号由后端自动生成，不提交）
    const data =
      (await formApi.getValues()) as MesWmOutsourceReceiptLineApi.OutsourceReceiptLine;
    data.receiptId = receiptId.value;
    delete data.batchCode;
    try {
      await (formData.value?.id
        ? updateOutsourceReceiptLine({ ...data, id: formData.value.id })
        : createOutsourceReceiptLine(data));
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
    const data = modalApi.getData<{
      id?: number;
      receiptId: number;
    }>();
    receiptId.value = data.receiptId;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getOutsourceReceiptLine(data.id);
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
