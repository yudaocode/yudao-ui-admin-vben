<script setup lang="ts">
import type { InfraJobApi } from '#/api/infra/job';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { getJob, getJobNextTimes } from '#/api/infra/job';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const formData = ref<InfraJobApi.Job>(); // 任务详情
const nextTimes = ref<Date[]>([]); // 下一次执行时间

const [Descriptions] = useDescription({
  componentProps: {
    border: true,
    column: 1,
    direction: 'horizontal',
    title: '',
    extra: '',
    labelWidth: 140,
  },
  schema: useDetailSchema(),
});

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
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="任务详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions :data="formData" />

    <!-- 后续执行时间 -->
    <div v-if="nextTimes.length > 0" class="mt-4">
      <h4 class="mb-2 text-lg font-medium">后续执行时间</h4>
      <div class="max-h-[200px] overflow-y-auto rounded border p-2">
        <div
          v-for="(nextTime, index) in nextTimes"
          :key="index"
          class="py-1 text-sm text-gray-600"
        >
          第 {{ index + 1 }} 次：{{ formatDateTime(nextTime.toString()) }}
        </div>
      </div>
    </div>
  </Modal>
</template>
