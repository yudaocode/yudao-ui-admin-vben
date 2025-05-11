<script lang="ts" setup>
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { NDescriptions, NDescriptionsItem } from 'naive-ui';

const formData = ref<SystemOperateLogApi.OperateLog>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemOperateLogApi.OperateLog>();
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
    title="操作日志详情"
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
      <NDescriptionsItem label="链路追踪" v-if="formData?.traceId">
        {{ formData?.traceId }}
      </NDescriptionsItem>
      <NDescriptionsItem label="操作人编号">
        {{ formData?.userId }}
      </NDescriptionsItem>
      <NDescriptionsItem label="操作人名字">
        {{ formData?.userName }}
      </NDescriptionsItem>
      <NDescriptionsItem label="操作人IP">
        {{ formData?.userIp }}
      </NDescriptionsItem>
      <NDescriptionsItem label="操作人UA">
        {{ formData?.userAgent }}
      </NDescriptionsItem>
      <NDescriptionsItem label="操作模块">
        {{ formData?.type }}
      </NDescriptionsItem>
      <NDescriptionsItem label="操作名">
        {{ formData?.subType }}
      </NDescriptionsItem>
      <NDescriptionsItem label="操作内容">
        {{ formData?.action }}
      </NDescriptionsItem>
      <NDescriptionsItem v-if="formData?.extra" label="操作拓展参数">
        {{ formData?.extra }}
      </NDescriptionsItem>
      <NDescriptionsItem label="请求URL">
        {{ formData?.requestMethod }} {{ formData?.requestUrl }}
      </NDescriptionsItem>
      <NDescriptionsItem label="操作时间">
        {{ formatDateTime(formData?.createTime || '') }}
      </NDescriptionsItem>
      <NDescriptionsItem label="业务编号">
        {{ formData?.bizId }}
      </NDescriptionsItem>
    </NDescriptions>
  </Modal>
</template>
