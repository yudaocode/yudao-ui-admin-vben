<script lang="ts" setup>
import type { MesWmProductReceiptDetailApi } from '#/api/mes/wm/productreceipt/detail';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createProductReceiptDetail,
  getProductReceiptDetail,
  updateProductReceiptDetail,
} from '#/api/mes/wm/productreceipt/detail';
import { $t } from '#/locales';

import { useDetailFormSchema } from '../data';

const emit = defineEmits<{ success: [lineId: number] }>();
const formData = ref<MesWmProductReceiptDetailApi.ProductReceiptDetail>();
const receiptId = ref<number>(); // 所属入库单编号
const lineId = ref<number>(); // 所属入库单行编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['上架明细'])
    : $t('ui.actionTitle.create', ['上架明细']);
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
  schema: useDetailFormSchema(),
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
      (await formApi.getValues()) as MesWmProductReceiptDetailApi.ProductReceiptDetail;
    data.receiptId = receiptId.value;
    data.lineId = lineId.value;
    try {
      await (formData.value?.id
        ? updateProductReceiptDetail({ ...data, id: formData.value.id })
        : createProductReceiptDetail(data));
      // 关闭并提示
      await modalApi.close();
      emit('success', lineId.value!);
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
    formApi.setState({ schema: useDetailFormSchema(formApi) });
    // 加载数据
    const data = modalApi.getData<{
      detailId?: number;
      itemId?: number;
      lineId: number;
      receiptId: number;
    }>();
    receiptId.value = data.receiptId;
    lineId.value = data.lineId;
    if (data.detailId) {
      modalApi.lock();
      try {
        formData.value = await getProductReceiptDetail(data.detailId);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    } else if (data.itemId) {
      await formApi.setFieldValue('itemId', data.itemId);
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
  </Modal>
</template>
