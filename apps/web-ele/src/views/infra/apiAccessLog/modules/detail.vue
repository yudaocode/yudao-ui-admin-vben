<script lang="ts" setup>
import type { InfraApiAccessLogApi } from '#/api/infra/api-access-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

const formData = ref<InfraApiAccessLogApi.ApiAccessLog>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<InfraApiAccessLogApi.ApiAccessLog>();
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
  <!-- TODO @puhui999：这个后续会做类似 antd 的 description 组件么？ -->
  <Modal
    title="API 访问日志详情"
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
      <ElDescriptionsItem label="用户信息">
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
      <ElDescriptionsItem label="请求结果">
        {{ formData?.responseBody }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="请求时间">
        {{ formatDateTime(formData?.beginTime || '') }} ~
        {{ formatDateTime(formData?.endTime || '') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="请求耗时">
        {{ formData?.duration }} ms
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作结果">
        <div v-if="formData?.resultCode === 0">正常</div>
        <div v-else-if="formData && formData?.resultCode > 0">
          失败 | {{ formData?.resultCode }} | {{ formData?.resultMsg }}
        </div>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作模块">
        {{ formData?.operateModule }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作名">
        {{ formData?.operateName }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作类型">
        <DictTag
          :type="DICT_TYPE.INFRA_OPERATE_TYPE"
          :value="formData?.operateType"
        />
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
