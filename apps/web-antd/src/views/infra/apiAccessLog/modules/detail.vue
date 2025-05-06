<script lang="ts" setup>
import type { InfraApiAccessLogApi } from '#/api/infra/api-access-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions } from 'ant-design-vue';

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
  <Modal
    title="API 访问日志详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions
      bordered
      :column="1"
      size="middle"
      class="mx-4"
      :label-style="{ width: '110px' }"
    >
      <Descriptions.Item label="日志编号">
        {{ formData?.id }}
      </Descriptions.Item>
      <Descriptions.Item label="链路追踪">
        {{ formData?.traceId }}
      </Descriptions.Item>
      <Descriptions.Item label="应用名">
        {{ formData?.applicationName }}
      </Descriptions.Item>
      <Descriptions.Item label="用户信息">
        {{ formData?.userId }}
        <DictTag :type="DICT_TYPE.USER_TYPE" :value="formData?.userType" />
      </Descriptions.Item>
      <Descriptions.Item label="用户IP">
        {{ formData?.userIp }}
      </Descriptions.Item>
      <Descriptions.Item label="用户UA">
        {{ formData?.userAgent }}
      </Descriptions.Item>
      <Descriptions.Item label="请求信息">
        {{ formData?.requestMethod }} {{ formData?.requestUrl }}
      </Descriptions.Item>
      <Descriptions.Item label="请求参数">
        {{ formData?.requestParams }}
      </Descriptions.Item>
      <Descriptions.Item label="请求结果">
        {{ formData?.responseBody }}
      </Descriptions.Item>
      <Descriptions.Item label="请求时间">
        {{ formatDateTime(formData?.beginTime || '') }} ~
        {{ formatDateTime(formData?.endTime || '') }}
      </Descriptions.Item>
      <Descriptions.Item label="请求耗时">
        {{ formData?.duration }} ms
      </Descriptions.Item>
      <Descriptions.Item label="操作结果">
        <div v-if="formData?.resultCode === 0">正常</div>
        <div v-else-if="formData && formData?.resultCode > 0">
          失败 | {{ formData?.resultCode }} | {{ formData?.resultMsg }}
        </div>
      </Descriptions.Item>
      <Descriptions.Item label="操作模块">
        {{ formData?.operateModule }}
      </Descriptions.Item>
      <Descriptions.Item label="操作名">
        {{ formData?.operateName }}
      </Descriptions.Item>
      <Descriptions.Item label="操作类型">
        <DictTag
          :type="DICT_TYPE.INFRA_OPERATE_TYPE"
          :value="formData?.operateType"
        />
      </Descriptions.Item>
    </Descriptions>
  </Modal>
</template>
