<script lang="ts" setup>
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

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
    <ElDescriptions
      border
      :column="1"
      size="default"
      class="mx-4"
      :label-style="{ width: '110px' }"
    >
      <ElDescriptionsItem label="日志编号">
        {{ formData?.id }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="链路追踪" v-if="formData?.traceId">
        {{ formData?.traceId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作人编号">
        {{ formData?.userId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作人名字">
        {{ formData?.userName }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作人IP">
        {{ formData?.userIp }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作人UA">
        {{ formData?.userAgent }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作模块">
        {{ formData?.type }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作名">
        {{ formData?.subType }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作内容">
        {{ formData?.action }}
      </ElDescriptionsItem>
      <ElDescriptionsItem v-if="formData?.extra" label="操作拓展参数">
        {{ formData?.extra }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="请求URL">
        {{ formData?.requestMethod }} {{ formData?.requestUrl }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作时间">
        {{ formatDateTime(formData?.createTime || '') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="业务编号">
        {{ formData?.bizId }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
