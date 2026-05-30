<script lang="ts" setup>
import type { MesWmTransferLineApi } from '#/api/mes/wm/transfer/line';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getMaterialStock } from '#/api/mes/wm/materialstock';
import {
  createTransferLine,
  getTransferLine,
  updateTransferLine,
} from '#/api/mes/wm/transfer/line';
import { $t } from '#/locales';

import { useLineFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmTransferLineApi.TransferLine>();
const transferId = ref<number>(); // 所属转移单编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['调拨物料'])
    : $t('ui.actionTitle.create', ['调拨物料']);
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
      (await formApi.getValues()) as MesWmTransferLineApi.TransferLine;
    data.transferId = transferId.value;
    try {
      await (formData.value?.id
        ? updateTransferLine({ ...data, id: formData.value.id })
        : createTransferLine(data));
      // 关闭并提示
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
      return;
    }
    formApi.setState({ schema: useLineFormSchema(formApi) });
    // 加载数据
    const data = modalApi.getData<{ id?: number; transferId: number }>();
    transferId.value = data.transferId;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getTransferLine(data.id);
      // 编辑时按当前库存在库量作为数量上限
      let quantityMax: number | undefined;
      if (formData.value.materialStockId) {
        const stock = await getMaterialStock(formData.value.materialStockId);
        quantityMax = stock?.quantity;
      }
      // 设置到 values
      await formApi.setValues({ ...formData.value, quantityMax });
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
