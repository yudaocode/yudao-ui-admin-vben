<script lang="ts" setup>
import type { MesWmOutsourceReceiptDetailApi } from '#/api/mes/wm/outsourcereceipt/detail';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createOutsourceReceiptDetail,
  getOutsourceReceiptDetail,
  updateOutsourceReceiptDetail,
} from '#/api/mes/wm/outsourcereceipt/detail';
import { $t } from '#/locales';

import { useDetailFormSchema } from '../data';

const emit = defineEmits<{ success: [lineId: number] }>();
const formData = ref<MesWmOutsourceReceiptDetailApi.OutsourceReceiptDetail>();
const receiptId = ref<number>(); // 所属入库单编号
const lineId = ref<number>(); // 所属入库单行编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['收货明细'])
    : $t('ui.actionTitle.create', ['收货明细']);
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
  wrapperClass: 'grid-cols-2',
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
      (await formApi.getValues()) as MesWmOutsourceReceiptDetailApi.OutsourceReceiptDetail;
    data.receiptId = receiptId.value;
    data.lineId = lineId.value;
    try {
      await (formData.value?.id
        ? updateOutsourceReceiptDetail({ ...data, id: formData.value.id })
        : createOutsourceReceiptDetail(data));
      // 关闭并提示
      await modalApi.close();
      emit('success', lineId.value!);
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
        formData.value = await getOutsourceReceiptDetail(data.detailId);
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
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
  </Modal>
</template>
