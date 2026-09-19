<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import TravelReimbursementDetail from '../detail/index.vue';

defineOptions({ name: 'OaTravelReimbursementDetailModal' });

const detailId = ref<number>(); // 单据编号

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      detailId.value = undefined;
      return;
    }
    const data = modalApi.getData() as { id?: number };
    detailId.value = data?.id;
  },
});
</script>

<template>
  <Modal
    title="差旅报销详情"
    class="w-[1200px]"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <TravelReimbursementDetail v-if="detailId" :key="detailId" :id="detailId" />
  </Modal>
</template>
