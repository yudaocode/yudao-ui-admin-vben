<script setup lang="ts">
import type { PayOrderApi } from '#/api/pay/order';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { getOrder } from '#/api/pay/order';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const detailData = ref<PayOrderApi.Order>();

const [Description] = useDescription({
  componentProps: {
    border: false,
    column: 2,
    direction: 'horizontal',
    title: '',
    labelWidth: 200,
    extra: '',
  },
  schema: useDetailSchema(),
});

const [Modal, modalApi] = useVbenModal({
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      detailData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<PayOrderApi.Order>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      detailData.value = await getOrder(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>
<template>
  <Modal
    title="订单详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Description :data="detailData" />
  </Modal>
</template>
