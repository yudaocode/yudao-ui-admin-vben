<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import VehicleReturnDetail from '../detail/index.vue';

const detailId = ref<number>(); // 申请编号

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      detailId.value = undefined;
      return;
    }
    // 复用独立业务详情，列表与 BPM 审批页保持一致
    const data = modalApi.getData() as { id?: number };
    detailId.value = data?.id;
  },
});
</script>

<template>
  <Modal
    title="还车申请详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <VehicleReturnDetail v-if="detailId" :key="detailId" :id="detailId" />
  </Modal>
</template>
