<script lang="ts" setup>
import type { MallOrderApi } from '#/api/mall/trade/order';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { pickUpOrderByVerifyCode } from '#/api/mall/trade/order';

import OrderDetail from '../../../order/detail/index.vue';

const emit = defineEmits(['success']);
const orderId = ref(0);
const pickUpVerifyCode = ref('');

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData() as {
      order: MallOrderApi.Order;
      pickUpVerifyCode: string;
    };
    orderId.value = data.order.id!;
    pickUpVerifyCode.value = data.pickUpVerifyCode;
  },
  async onConfirm() {
    modalApi.lock();
    try {
      await pickUpOrderByVerifyCode(pickUpVerifyCode.value);
      message.success('核销成功');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="订单详情" confirm-text="确认核销" class="w-4/5">
    <OrderDetail v-if="orderId" :id="orderId" :show-pick-up="false" />
  </Modal>
</template>
