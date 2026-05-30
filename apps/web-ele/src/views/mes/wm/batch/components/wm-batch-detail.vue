<script lang="ts" setup>
import type { MesWmBatchApi } from '#/api/mes/wm/batch';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { getBatch } from '#/api/mes/wm/batch';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const detailData = ref<MesWmBatchApi.Batch>(); // 当前批次详情

const [Descriptions] = useDescription({
  border: true,
  column: 3,
  schema: useDetailSchema(),
});

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      detailData.value = undefined;
      return;
    }
    const data = modalApi.getData<{ id?: number }>();
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      detailData.value = await getBatch(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});

defineExpose({
  open: (id: number) => modalApi.setData({ id }).open(),
});
</script>

<template>
  <Modal title="批次详情" class="w-3/5">
    <Descriptions class="mx-4" :data="detailData" />
  </Modal>
</template>
