<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import Detail from '../detail/index.vue';

defineOptions({ name: 'OaSupplyApplyDetail' });

const detailId = ref<number>(); // 申请编号

const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
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
  <Modal title="领用申请详情" class="w-2/3">
    <Detail v-if="detailId" :key="detailId" :id="detailId" />
  </Modal>
</template>
