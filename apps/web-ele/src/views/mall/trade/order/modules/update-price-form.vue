<script lang="ts" setup>
import type { MallOrderApi } from '#/api/mall/trade/order';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { updateOrderPrice } from '#/api/mall/trade/order';
import { $t } from '#/locales';
import { usePriceFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: usePriceFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MallOrderApi.PriceRequest;
    try {
      await updateOrderPrice(data);
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
      return;
    }
    // 加载数据
    const data = modalApi.getData<MallOrderApi.Order>();
    if (!data) {
      return;
    }
    modalApi.lock();
    try {
      await formApi.setValues({
        id: data.id,
        payPrice: data.payPrice,
        adjustPrice: data.adjustPrice ? data.adjustPrice / 100 : 0,
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-1/3" title="调整价格">
    <Form class="mx-4" />
  </Modal>
</template>
