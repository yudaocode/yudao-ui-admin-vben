<script lang="ts" setup>
import type { InfraJobLogApi } from '#/api/infra/job-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { getJobLog } from '#/api/infra/job-log';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

const formData = ref<InfraJobLogApi.JobLog>();

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
      formData.value = await getJobLog(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="日志详情"
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
      <ElDescriptionsItem label="日志编号">
        {{ formData?.id }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="任务编号">
        {{ formData?.jobId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="处理器的名字">
        {{ formData?.handlerName }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="处理器的参数">
        {{ formData?.handlerParam }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="第几次执行">
        {{ formData?.executeIndex }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="执行时间">
        {{ formData?.beginTime ? formatDateTime(formData.beginTime) : '' }} ~
        {{ formData?.endTime ? formatDateTime(formData.endTime) : '' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="执行时长">
        {{ formData?.duration ? `${formData.duration} 毫秒` : '' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="任务状态">
        <DictTag
          :type="DICT_TYPE.INFRA_JOB_LOG_STATUS"
          :value="formData?.status"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="执行结果">
        {{ formData?.result }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
