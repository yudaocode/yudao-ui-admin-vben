<script lang="ts" setup>
import type { InfraJobApi } from '#/api/infra/job';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { getJob, getJobNextTimes } from '#/api/infra/job';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const formData = ref<InfraJobApi.Job>(); // 任务详情
const nextTimes = ref<Date[]>([]); // 下一次执行时间

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ id: number }>();
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getJob(data.id);
      // 获取下一次执行时间
      nextTimes.value = await getJobNextTimes(data.id);
      formData.value.nextTimes = nextTimes.value;
    } finally {
      modalApi.unlock();
    }
  },
});

const [Description] = useDescription({
  componentProps: {
    bordered: true,
    column: 1,
    class: 'mx-4',
  },
  schema: useDetailSchema(),
});
</script>

<template>
  <Modal
    title="任务详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Description :data="formData" />
  </Modal>
</template>
