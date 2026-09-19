<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import ReimbursementDetail from '../detail/index.vue';

defineOptions({ name: 'OaReimbursementDetailDialog' });

const detailId = ref<number>(); // 申请编号

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
    title="费用报销详情"
    class="w-[1100px]"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <ReimbursementDetail v-if="detailId" :id="detailId" />
  </Modal>
</template>
