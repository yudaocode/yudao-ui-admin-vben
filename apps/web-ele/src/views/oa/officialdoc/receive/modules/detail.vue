<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import DetailContent from '../detail/index.vue';

const detailId = ref<number>(); // 收文编号

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
    title="公文收文详情"
    class="w-2/3"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <DetailContent v-if="detailId" :id="detailId" :key="detailId" />
  </Modal>
</template>
