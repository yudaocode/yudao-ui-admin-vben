<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import RegularApplyDetail from '../detail/index.vue';

defineOptions({ name: 'OaRegularApplyDetailDialog' });

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
    title="转正申请详情"
    class="w-[900px]"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <RegularApplyDetail v-if="detailId" :key="detailId" :id="detailId" />
  </Modal>
</template>
