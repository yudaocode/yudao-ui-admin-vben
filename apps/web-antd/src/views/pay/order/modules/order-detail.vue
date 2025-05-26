<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions, Divider, Tag } from 'ant-design-vue';

import * as OrderApi from '#/api/pay/order';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils/dict';

const detailData = ref<OrderApi.PayOrderApi.Order>();

const [BasicModal, modalApi] = useVbenModal({
  fullscreenButton: false,
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);

    const { id } = modalApi.getData() as {
      id: number;
    };

    detailData.value = await OrderApi.getOrderDetail(id);

    modalApi.modalLoading(false);
  },
});
</script>
<template>
  <BasicModal :close-on-click-modal="false" title="订单详情" class="w-[700px]">
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
          ￥{{ (detailData?.price || 0 / 100.0).toFixed(2) }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="手续费">
        <Tag color="orange" size="small">
          ￥{{ (detailData?.channelFeePrice || 0 / 100.0).toFixed(2) }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="手续费比例">
        {{ (detailData?.channelFeeRate || 0 / 100.0).toFixed(2) }}%
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
          ￥{{ (detailData?.refundPrice || 0 / 100.0).toFixed(2) }}
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
  </BasicModal>
</template>
