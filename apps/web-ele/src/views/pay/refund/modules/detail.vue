<script lang="ts" setup>
import type { PayRefundApi } from '#/api/pay/refund';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElDivider } from 'element-plus';

import { getRefund } from '#/api/pay/refund';
import { useDescription } from '#/components/description';

import { useBaseDetailSchema, useChannelDetailSchema } from '../data';

const formData = ref<PayRefundApi.Refund>();

const [BaseDescription] = useDescription({
  componentProps: {
    border: false,
    column: 2,
    direction: 'horizontal',
    title: '',
    labelWidth: 200,
    extra: '',
  },
  schema: useBaseDetailSchema(),
});

const [ChannelDescription] = useDescription({
  componentProps: {
    border: false,
    column: 2,
    direction: 'horizontal',
    title: '',
    labelWidth: 200,
    extra: '',
  },
  schema: useChannelDetailSchema(),
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<PayRefundApi.Refund>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getRefund(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="退款详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <BaseDescription :data="formData" />
    <ElDivider />
    <ChannelDescription :data="formData" />
  </Modal>
</template>
