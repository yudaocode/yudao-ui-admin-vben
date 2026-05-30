<script lang="ts" setup>
import type { MesWmReturnSalesLineApi } from '#/api/mes/wm/returnsales/line';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createReturnSalesLine,
  getReturnSalesLine,
  updateReturnSalesLine,
} from '#/api/mes/wm/returnsales/line';
import { $t } from '#/locales';

import { useLineFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmReturnSalesLineApi.ReturnSalesLine>();
const returnId = ref<number>(); // 所属退货单编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['销售退货单行'])
    : $t('ui.actionTitle.create', ['销售退货单行']);
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
      (await formApi.getValues()) as MesWmReturnSalesLineApi.ReturnSalesLine;
    data.returnId = returnId.value;
    try {
      await (formData.value?.id
        ? updateReturnSalesLine({ ...data, id: formData.value.id })
        : createReturnSalesLine(data));
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
    // 加载数据
    const data = modalApi.getData<{
      clientId?: number;
      id?: number;
      returnId: number;
      salesOrderCode?: string;
    }>();
    returnId.value = data.returnId;
    formApi.setState({
      schema: useLineFormSchema(data.clientId, data.salesOrderCode),
    });
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getReturnSalesLine(data.id);
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
