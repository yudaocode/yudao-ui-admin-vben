<script lang="ts" setup>
import type { SystemSmsLogApi } from '#/api/system/sms/log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

const formData = ref<SystemSmsLogApi.SmsLog>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemSmsLogApi.SmsLog>();
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
    title="短信日志详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <ElDescriptions
      border
      :column="2"
      size="default"
      class="mx-4"
      :label-style="{ width: '140px' }"
    >
      <ElDescriptionsItem label="创建时间">
        {{ formatDateTime(formData?.createTime || '') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="手机号">
        {{ formData?.mobile }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="短信渠道">
        {{ formData?.channelCode }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="模板编号">
        {{ formData?.templateId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="模板类型">
        <DictTag
          :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE"
          :value="formData?.templateType"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="短信内容">
        {{ formData?.templateContent }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="发送状态">
        <DictTag
          :type="DICT_TYPE.SYSTEM_SMS_SEND_STATUS"
          :value="formData?.sendStatus"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="发送时间">
        {{ formatDateTime(formData?.sendTime || '') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="API 发送编码">
        {{ formData?.apiSendCode }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="API 发送消息">
        {{ formData?.apiSendMsg }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="接收状态">
        <DictTag
          :type="DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS"
          :value="formData?.receiveStatus"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="接收时间">
        {{ formatDateTime(formData?.receiveTime || '') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="API 接收编码">
        {{ formData?.apiReceiveCode }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="API 接收消息" :span="2">
        {{ formData?.apiReceiveMsg }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="API 请求 ID">
        {{ formData?.apiRequestId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="API 序列号">
        {{ formData?.apiSerialNo }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
