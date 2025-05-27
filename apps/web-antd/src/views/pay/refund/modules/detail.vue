<script lang="ts" setup>
import type { PayRefundApi } from '#/api/pay/refund';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions, Divider, Tag } from 'ant-design-vue';

import { getRefund } from '#/api/pay/refund';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

const formData = ref<PayRefundApi.Refund>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<PayRefundApi.Refund>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getRefund(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="退款详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions bordered :column="2" size="middle" class="mx-4">
      <Descriptions.Item label="商户退款单号">
        <Tag size="small">{{ formData?.merchantRefundId }}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="渠道退款单号">
        <Tag type="success" size="small" v-if="formData?.channelRefundNo">
          {{ formData?.channelRefundNo }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="商户支付单号">
        <Tag size="small">{{ formData?.merchantOrderId }}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="渠道支付单号">
        <Tag type="success" size="small">
          {{ formData?.channelOrderNo }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="应用编号">
        {{ formData?.appId }}
      </Descriptions.Item>
      <Descriptions.Item label="应用名称">
        {{ formData?.appName }}
      </Descriptions.Item>
      <Descriptions.Item label="支付金额">
        <Tag type="success" size="small">
          ￥{{ (formData?.payPrice || 0) / 100.0 }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="退款金额">
        <Tag size="mini" type="danger">
          ￥{{ (formData?.refundPrice || 0) / 100.0 }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="退款状态">
        <DictTag
          :type="DICT_TYPE.PAY_REFUND_STATUS"
          :value="formData?.status"
        />
      </Descriptions.Item>
      <Descriptions.Item label="退款时间">
        {{ formatDateTime(formData?.successTime || '') }}
      </Descriptions.Item>
      <Descriptions.Item label="创建时间">
        {{ formatDateTime(formData?.createTime || '') }}
      </Descriptions.Item>
      <Descriptions.Item label="更新时间">
        {{ formatDateTime(formData?.updateTime || '') }}
      </Descriptions.Item>
    </Descriptions>
    <Divider />
    <Descriptions bordered :column="2" size="middle" class="mx-4">
      <Descriptions.Item label="退款渠道">
        <DictTag
          :type="DICT_TYPE.PAY_CHANNEL_CODE"
          :value="formData?.channelCode"
        />
      </Descriptions.Item>
      <Descriptions.Item label="退款原因">
        {{ formData?.reason }}
      </Descriptions.Item>
      <Descriptions.Item label="退款 IP">
        {{ formData?.userIp }}
      </Descriptions.Item>
      <Descriptions.Item label="通知 URL">
        {{ formData?.notifyUrl }}
      </Descriptions.Item>
    </Descriptions>
    <Divider />
    <Descriptions bordered :column="2" size="middle" class="mx-4">
      <Descriptions.Item label="渠道错误码">
        {{ formData?.channelErrorCode }}
      </Descriptions.Item>
      <Descriptions.Item label="渠道错误码描述">
        {{ formData?.channelErrorMsg }}
      </Descriptions.Item>
    </Descriptions>

    <Descriptions bordered :column="1" size="middle" class="mx-4">
      <Descriptions.Item label="支付通道异步回调内容">
        <p class="whitespace-pre-wrap break-words">
          {{ formData?.channelNotifyData }}
        </p>
      </Descriptions.Item>
    </Descriptions>
  </Modal>
</template>
