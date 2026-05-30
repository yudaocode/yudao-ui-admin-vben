<script lang="ts" setup>
import type { MesWmProductSalesLineApi } from '#/api/mes/wm/productsales/line';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createProductSalesLine,
  getProductSalesLine,
  updateProductSalesLine,
} from '#/api/mes/wm/productsales/line';
import { $t } from '#/locales';

import { useLineFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmProductSalesLineApi.ProductSalesLine>();
const salesId = ref<number>(); // 所属出库单编号
const noticeId = ref<number>(); // 所属发货通知单编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['销售出库单行'])
    : $t('ui.actionTitle.create', ['销售出库单行']);
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
      (await formApi.getValues()) as MesWmProductSalesLineApi.ProductSalesLine;
    data.salesId = salesId.value;
    try {
      await (formData.value?.id
        ? updateProductSalesLine({ ...data, id: formData.value.id })
        : createProductSalesLine(data));
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
      id?: number;
      noticeId?: number;
      salesId: number;
    }>();
    salesId.value = data.salesId;
    noticeId.value = data.noticeId;
    formApi.setState({ schema: useLineFormSchema(!!data.noticeId, formApi) });
    if (data.noticeId) {
      await formApi.setFieldValue('noticeId', data.noticeId);
    }
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getProductSalesLine(data.id);
      // 设置到 values
      await formApi.setValues({ ...formData.value, noticeId: noticeId.value });
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
