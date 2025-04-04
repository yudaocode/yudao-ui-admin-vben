<script lang="ts" setup>
import type { SystemSmsLogApi } from '#/api/system/sms/log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions, Tag } from 'ant-design-vue';

import { DICT_TYPE, getDictLabel } from '#/utils/dict';

const formData = ref<SystemSmsLogApi.SmsLog>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
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
      modalApi.lock(false);
    }
  },
});
</script>

<template>
  <Modal title="短信日志详情">
    <div class="p-4">
      <Descriptions
        :column="{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 2, xs: 1 }"
        bordered
      >
        <Descriptions.Item label="创建时间">
          {{ formatDateTime(formData?.createTime || '') }}
        </Descriptions.Item>
        <Descriptions.Item label="手机号">
          {{ formData?.mobile }}
        </Descriptions.Item>
        <Descriptions.Item label="短信渠道">
          {{ formData?.channelCode }}
        </Descriptions.Item>
        <Descriptions.Item label="模板编号">
          {{ formData?.templateId }}
        </Descriptions.Item>
        <Descriptions.Item label="模板类型">
          {{ formData?.templateType }}
        </Descriptions.Item>
        <Descriptions.Item label="短信内容" :span="3">
          {{ formData?.templateContent }}
        </Descriptions.Item>
        <Descriptions.Item label="发送状态">
          <!-- TODO @芋艿: 数据字典-->
          <Tag color="processing">
            {{
              getDictLabel(
                DICT_TYPE.SYSTEM_SMS_SEND_STATUS,
                formData?.sendStatus,
              )
            }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="发送时间">
          {{ formatDateTime(formData?.sendTime || '') }}
        </Descriptions.Item>
        <Descriptions.Item label="API发送编码">
          {{ formData?.apiSendCode }}
        </Descriptions.Item>
        <Descriptions.Item label="API发送消息" :span="2">
          {{ formData?.apiSendMsg }}
        </Descriptions.Item>
        <Descriptions.Item label="接收状态">
          <!-- TODO @芋艿: 数据字典-->
          <Tag color="processing">
            {{
              getDictLabel(
                DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS,
                formData?.receiveStatus,
              )
            }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="接收时间">
          {{ formatDateTime(formData?.receiveTime || '') }}
        </Descriptions.Item>
        <Descriptions.Item label="API接收编码">
          {{ formData?.apiReceiveCode }}
        </Descriptions.Item>
        <Descriptions.Item label="API接收消息" :span="2">
          {{ formData?.apiReceiveMsg }}
        </Descriptions.Item>
        <Descriptions.Item label="API请求ID">
          {{ formData?.apiRequestId }}
        </Descriptions.Item>
        <Descriptions.Item label="API序列号">
          {{ formData?.apiSerialNo }}
        </Descriptions.Item>
      </Descriptions>
    </div>
  </Modal>
</template>
