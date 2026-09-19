<script lang="ts" setup>
import type { OaSealApi } from '#/api/oa/seal';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Image } from 'ant-design-vue';

import { getSeal } from '#/api/oa/seal';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const formData = ref<OaSealApi.Seal>(); // 印章详情

const [Descriptions] = useDescription({
  bordered: true,
  column: 2,
  schema: useDetailSchema(),
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSeal(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="印章详情"
    class="w-[800px]"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions :data="formData">
      <template #picUrl="{ data }">
        <Image v-if="data?.picUrl" :src="data.picUrl" class="h-25 w-25" />
        <span v-else>-</span>
      </template>
    </Descriptions>
  </Modal>
</template>
