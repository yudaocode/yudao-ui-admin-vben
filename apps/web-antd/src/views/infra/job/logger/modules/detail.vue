<script lang="ts" setup>
import type { InfraJobLogApi } from '#/api/infra/job-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions } from 'ant-design-vue';

import { getJobLog } from '#/api/infra/job-log';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils/dict';

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
      modalApi.lock(false);
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
    <Descriptions
      :column="1"
      bordered
      size="middle"
      class="mx-4"
      :label-style="{ width: '140px' }"
    >
      <Descriptions.Item label="日志编号">
        {{ formData?.id }}
      </Descriptions.Item>
      <Descriptions.Item label="任务编号">
        {{ formData?.jobId }}
      </Descriptions.Item>
      <Descriptions.Item label="处理器的名字">
        {{ formData?.handlerName }}
      </Descriptions.Item>
      <Descriptions.Item label="处理器的参数">
        {{ formData?.handlerParam }}
      </Descriptions.Item>
      <Descriptions.Item label="第几次执行">
        {{ formData?.executeIndex }}
      </Descriptions.Item>
      <Descriptions.Item label="执行时间">
        {{ formData?.beginTime ? formatDateTime(formData.beginTime) : '' }} ~
        {{ formData?.endTime ? formatDateTime(formData.endTime) : '' }}
      </Descriptions.Item>
      <Descriptions.Item label="执行时长">
        {{ formData?.duration ? `${formData.duration} 毫秒` : '' }}
      </Descriptions.Item>
      <Descriptions.Item label="任务状态">
        <DictTag
          :type="DICT_TYPE.INFRA_JOB_LOG_STATUS"
          :value="formData?.status"
        />
      </Descriptions.Item>
      <Descriptions.Item label="执行结果">
        {{ formData?.result }}
      </Descriptions.Item>
    </Descriptions>
  </Modal>
</template>
