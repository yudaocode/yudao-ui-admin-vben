<script lang="ts" setup>
import type { OrderApi } from '#/api/mpr/order';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { getOrder } from '#/api/mpr/order';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const formData = ref<OrderApi.Order>(); // 任务详情
// eslint-disable-next-line no-unused-vars
const _nextTimes = ref<Date[]>([]); // 下一次执行时间

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ id: number }>();
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getOrder(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});

const [Description] = useDescription({
  componentProps: {
    bordered: true,
    column: 1,
    class: 'mx-4',
  },
  labelStyle: {
    textAlign: 'right',
    fontWeight: 'bold',
    minWidth: '140px',
  },
  schema: useDetailSchema(),
});
</script>

<template>
  <Modal
    title="账单详情"
    class="w-2/5"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Description :data="formData" />
  </Modal>
</template>
