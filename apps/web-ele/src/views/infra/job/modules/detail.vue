<script lang="ts" setup>
import type { InfraJobApi } from '#/api/infra/job';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

import { getJob, getJobNextTimes } from '#/api/infra/job';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

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
    <ElDescriptions
      :column="1"
      border
      size="default"
      class="mx-4"
      :label-width="140"
    >
      <ElDescriptionsItem label="任务编号">
        {{ formData?.id }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="任务名称">
        {{ formData?.name }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="任务状态">
        <DictTag :type="DICT_TYPE.INFRA_JOB_STATUS" :value="formData?.status" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="处理器的名字">
        {{ formData?.handlerName }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="处理器的参数">
        {{ formData?.handlerParam }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="Cron 表达式">
        {{ formData?.cronExpression }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="重试次数">
        {{ formData?.retryCount }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="重试间隔">
        {{
          formData?.retryInterval ? `${formData.retryInterval} 毫秒` : '无间隔'
        }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="监控超时时间">
        {{
          formData?.monitorTimeout && formData.monitorTimeout > 0
            ? `${formData.monitorTimeout} 毫秒`
            : '未开启'
        }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="后续执行时间">
        <ElTimeline class="h-[180px]">
          <ElTimelineItem
            v-for="(nextTime, index) in nextTimes"
            :key="index"
            type="primary"
          >
            第 {{ index + 1 }} 次：{{ formatDateTime(nextTime.toString()) }}
          </ElTimelineItem>
        </ElTimeline>
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
