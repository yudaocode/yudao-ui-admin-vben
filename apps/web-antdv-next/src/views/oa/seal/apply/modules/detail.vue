<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import SealApplyDetail from '../detail/index.vue';

const detailId = ref<number>(); // 申请编号

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      detailId.value = undefined;
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
    title="用印申请详情"
    class="w-[1000px]"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <SealApplyDetail v-if="detailId" :key="detailId" :id="detailId" />
  </Modal>
</template>
