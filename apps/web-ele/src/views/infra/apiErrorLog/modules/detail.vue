<script lang="ts" setup>
import type { InfraApiErrorLogApi } from '#/api/infra/api-error-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem, ElInput } from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

const formData = ref<InfraApiErrorLogApi.ApiErrorLog>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<InfraApiErrorLogApi.ApiErrorLog>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = data;
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="API错误日志详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <ElDescriptions
      border
      :column="1"
      size="default"
      class="mx-4"
      label-width="110px"
    >
      <ElDescriptionsItem label="日志编号">
        {{ formData?.id }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="链路追踪">
        {{ formData?.traceId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="应用名">
        {{ formData?.applicationName }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="用户编号">
        {{ formData?.userId }}
        <DictTag :type="DICT_TYPE.USER_TYPE" :value="formData?.userType" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="用户IP">
        {{ formData?.userIp }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="用户UA">
        {{ formData?.userAgent }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="请求信息">
        {{ formData?.requestMethod }} {{ formData?.requestUrl }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="请求参数">
        {{ formData?.requestParams }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="异常时间">
        {{ formatDateTime(formData?.exceptionTime || '') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="异常名">
        {{ formData?.exceptionName }}
      </ElDescriptionsItem>
      <ElDescriptionsItem v-if="formData?.exceptionStackTrace" label="异常堆栈">
        <ElInput
          type="textarea"
          :model-value="formData?.exceptionStackTrace"
          :autosize="{ maxRows: 20 }"
          readonly
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="处理状态">
        <DictTag
          :type="DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS"
          :value="formData?.processStatus"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem v-if="formData?.processUserId" label="处理人">
        {{ formData?.processUserId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem v-if="formData?.processTime" label="处理时间">
        {{ formatDateTime(formData?.processTime || '') }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
