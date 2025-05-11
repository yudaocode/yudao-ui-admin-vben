<script lang="ts" setup>
import type { InfraApiErrorLogApi } from '#/api/infra/api-error-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { NDescriptions, NDescriptionsItem, NInput } from 'naive-ui';

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
    <NDescriptions
      bordered
      :column="1"
      size="middle"
      class="mx-4"
      :label-style="{ width: '110px' }"
    >
      <NDescriptionsItem label="日志编号">
        {{ formData?.id }}
      </NDescriptionsItem>
      <NDescriptionsItem label="链路追踪">
        {{ formData?.traceId }}
      </NDescriptionsItem>
      <NDescriptionsItem label="应用名">
        {{ formData?.applicationName }}
      </NDescriptionsItem>
      <NDescriptionsItem label="用户编号">
        {{ formData?.userId }}
        <DictTag :type="DICT_TYPE.USER_TYPE" :value="formData?.userType" />
      </NDescriptionsItem>
      <NDescriptionsItem label="用户IP">
        {{ formData?.userIp }}
      </NDescriptionsItem>
      <NDescriptionsItem label="用户UA">
        {{ formData?.userAgent }}
      </NDescriptionsItem>
      <NDescriptionsItem label="请求信息">
        {{ formData?.requestMethod }} {{ formData?.requestUrl }}
      </NDescriptionsItem>
      <NDescriptionsItem label="请求参数">
        {{ formData?.requestParams }}
      </NDescriptionsItem>
      <NDescriptionsItem label="异常时间">
        {{ formatDateTime(formData?.exceptionTime || '') }}
      </NDescriptionsItem>
      <NDescriptionsItem label="异常名">
        {{ formData?.exceptionName }}
      </NDescriptionsItem>
      <NDescriptionsItem v-if="formData?.exceptionStackTrace" label="异常堆栈">
        <NInput
          type="textarea"
          :value="formData?.exceptionStackTrace"
          :auto-size="{ maxRows: 20 }"
          readonly
        />
      </NDescriptionsItem>
      <NDescriptionsItem label="处理状态">
        <DictTag
          :type="DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS"
          :value="formData?.processStatus"
        />
      </NDescriptionsItem>
      <NDescriptionsItem v-if="formData?.processUserId" label="处理人">
        {{ formData?.processUserId }}
      </NDescriptionsItem>
      <NDescriptionsItem v-if="formData?.processTime" label="处理时间">
        {{ formatDateTime(formData?.processTime || '') }}
      </NDescriptionsItem>
    </NDescriptions>
  </Modal>
</template>
