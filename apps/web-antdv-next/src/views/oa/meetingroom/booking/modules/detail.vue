<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import BookingDetail from '../detail/index.vue';

defineOptions({ name: 'OaMeetingRoomBookingDetailModal' });

const detailId = ref<number>(); // 预定编号

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    detailId.value = data?.id;
  },
});
</script>

<template>
  <Modal
    title="会议室预定详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <BookingDetail v-if="detailId" :id="detailId" :key="detailId" />
  </Modal>
</template>
