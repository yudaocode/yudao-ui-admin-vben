<script setup lang="ts">
import type { PayOrderApi } from '#/api/pay/order';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { floatToFixed2, formatDateTime } from '@vben/utils';

import { Descriptions, Divider, Tag } from 'ant-design-vue';

import { getOrder } from '#/api/pay/order';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

const detailData = ref<PayOrderApi.Order>();

const [Modal, modalApi] = useVbenModal({
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      detailData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<PayOrderApi.Order>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      detailData.value = await getOrder(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>
<template>
  <Modal
    title="订单详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions :column="2">
      <Descriptions.Item label="商户单号">
        {{ detailData?.merchantOrderId }}
      </Descriptions.Item>
      <Descriptions.Item label="支付单号">
        {{ detailData?.no }}
      </Descriptions.Item>
      <Descriptions.Item label="应用编号">
        {{ detailData?.appId }}
      </Descriptions.Item>
      <Descriptions.Item label="应用名称">
        {{ detailData?.appName }}
      </Descriptions.Item>
      <Descriptions.Item label="支付状态">
        <DictTag
          size="small"
          :type="DICT_TYPE.PAY_ORDER_STATUS"
          :value="detailData?.status"
        />
      </Descriptions.Item>
      <Descriptions.Item label="支付金额">
        <Tag color="green" size="small">
          ￥{{ floatToFixed2(detailData?.price) }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="手续费">
        <Tag color="orange" size="small">
          ￥{{ floatToFixed2(detailData?.channelFeePrice) }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="手续费比例">
        {{ floatToFixed2(detailData?.channelFeeRate) }}%
      </Descriptions.Item>
      <Descriptions.Item label="支付时间">
        {{ formatDateTime(detailData?.successTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="失效时间">
        {{ formatDateTime(detailData?.expireTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="创建时间">
        {{ formatDateTime(detailData?.createTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="更新时间">
        {{ formatDateTime(detailData?.updateTime) }}
      </Descriptions.Item>
    </Descriptions>
    <Divider />
    <Descriptions :column="2">
      <Descriptions.Item label="商品标题">
        {{ detailData?.subject }}
      </Descriptions.Item>
      <Descriptions.Item label="商品描述">
        {{ detailData?.body }}
      </Descriptions.Item>
      <Descriptions.Item label="支付渠道">
        <DictTag
          size="small"
          :type="DICT_TYPE.PAY_CHANNEL_CODE"
          :value="detailData?.channelCode"
        />
      </Descriptions.Item>
      <Descriptions.Item label="支付 IP">
        {{ detailData?.userIp }}
      </Descriptions.Item>
      <Descriptions.Item label="渠道单号">
        <Tag size="small" color="green" v-if="detailData?.channelOrderNo">
          {{ detailData?.channelOrderNo }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="渠道用户">
        {{ detailData?.channelUserId }}
      </Descriptions.Item>
      <Descriptions.Item label="退款金额" :span="2">
        <Tag size="small" color="red">
          ￥{{ floatToFixed2(detailData?.refundPrice) }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="通知 URL">
        {{ detailData?.notifyUrl }}
      </Descriptions.Item>
    </Descriptions>
    <Divider />
    <Descriptions :column="1">
      <Descriptions.Item label="支付通道异步回调内容">
        {{ detailData?.channelNotifyData }}
      </Descriptions.Item>
    </Descriptions>
  </Modal>
</template>
