<script lang="ts" setup>
import type { MallOrderApi } from '#/api/mall/trade/order';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { deliveryOrder } from '#/api/mall/trade/order';
import { $t } from '#/locales';
import { useDeliveryFormSchema } from '../data';

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
  schema: useDeliveryFormSchema(),
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
    const data = (await formApi.getValues()) as MallOrderApi.DeliveryRequest;
    if (data.expressType === 'none') {
      // 无需发货的情况
      data.logisticsId = 0;
      data.logisticsNo = '';
    }
    try {
      await deliveryOrder(data);
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
      await formApi.setValues({ id: data.id });
      if (data.logisticsId === 0) {
        await formApi.setValues({ expressType: 'none' });
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-1/3" title="发货">
    <Form class="mx-4" />
  </Modal>
</template>
