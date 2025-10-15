<script lang="ts" setup>
import type { MallOrderApi } from '#/api/mall/trade/order';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { deliveryOrder } from '#/api/mall/trade/order';
import { $t } from '#/locales';

import { useDeliveryFormSchema } from '../data';

const emit = defineEmits(['success']);

const formData = ref({
  id: 0,
  expressType: 'express',
  logisticsId: 0,
  logisticsNo: '',
});

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
    const data = await formApi.getValues();
    if (data.expressType === 'none') {
      // 无需发货的情况
      data.logisticsId = 0;
      data.logisticsNo = '';
    }
    try {
      await deliveryOrder(data as MallOrderApi.DeliveryRequest);
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
      return;
    }
    // 加载数据
    const data = modalApi.getData<MallOrderApi.Order>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value.id = data.id;
      // 根据当前物流信息判断发货方式
      formData.value.expressType = data.logisticsId === 0 ? 'none' : 'express';
      formData.value.logisticsId = data.logisticsId || 0;
      formData.value.logisticsNo = data.logisticsNo || '';
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="发货" class="w-1/3">
    <Form class="mx-4" />
  </Modal>
</template>
