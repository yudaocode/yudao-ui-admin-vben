<script setup lang="ts">
import type { PayOrderApi } from '#/api/pay/order';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { formatDate } from '@vben/utils';

import { Card, Descriptions, message } from 'ant-design-vue';

import { getOrder } from '#/api/pay/order';
import { PayChannelEnum, PayOrderStatusEnum } from '#/utils/constants';

import { channelsAlipay, channelsMock, channelsWechat } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'PayCashier' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const id = ref(); // 支付单号
const returnUrl = ref<string>(); // 支付完的回调地址
const route = useRoute();
const router = useRouter();
const payOrder = ref<PayOrderApi.Order>();

/** 获得支付信息 */
async function getDetail() {
  // 1. 获取路由参数
  id.value = route.query.id;
  if (route.query.returnUrl) {
    returnUrl.value = decodeURIComponent(route.query.returnUrl as string);
  }
  // 1.1 未传递订单编号
  if (!id.value) {
    message.error('未传递支付单号，无法查看对应的支付信息');
    // goReturnUrl('cancel')
    return;
  }
  const res = await getOrder(id.value);
  // 1.2 无法查询到支付信息
  if (!res) {
    message.error('支付订单不存在，请检查！');
    // goReturnUrl('cancel')
    return;
  }
  // 1.3 如果已支付、或者已关闭，则直接跳转
  if (res.status === PayOrderStatusEnum.SUCCESS.status) {
    message.success('支付成功');
    // goReturnUrl('success')
    return;
  } else if (res.status === PayOrderStatusEnum.CLOSED.status) {
    message.error('无法支付，原因：订单已关闭');
    // goReturnUrl('close')
    return;
  }
  payOrder.value = res;
}

function handlePay(channelCode: string) {
  // 微信公众号、小程序支付，无法在 PC 网页中进行
  if (channelCode === PayChannelEnum.WX_PUB.code) {
    message.error('微信公众号支付：不支持 PC 网站');
    return;
  }
  if (channelCode === PayChannelEnum.WX_LITE.code) {
    message.error('微信小程序：不支持 PC 网站');
    return;
  }
  const data = {
    id: id.value,
    channelCode,
    returnUrl: location.href, // 支付成功后，支付渠道跳转回当前页；再由当前页，跳转回 {@link returnUrl} 对应的地址
  };
  formModalApi.setData(data).open();
}

function success(data?: { channelCode: string; data?: any }) {
  if (!data) {
    clearQueryInterval();
  }
  if (data.channelCode === PayChannelEnum.ALIPAY_BAR.code) {
    message.success('支付宝条码支付');
  } else if (data.channelCode === PayChannelEnum.WX_BAR.code) {
    message.success('微信条码支付');
  } else {
    message.success('支付成功');
  }
}

onMounted(async () => {
  await getDetail();
});
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="success" />

    <Card class="mt-4">
      <Descriptions :column="3" :title="payOrder?.subject ?? '商品详情'">
        <Descriptions.Item label="支付单号">
          {{ payOrder?.id }}
        </Descriptions.Item>
        <Descriptions.Item label="商品标题">
          {{ payOrder?.subject }}
        </Descriptions.Item>
        <Descriptions.Item label="商品内容">
          {{ payOrder?.body }}
        </Descriptions.Item>
        <Descriptions.Item label="支付金额">
          {{ `￥${(payOrder?.price ? payOrder.price / 100.0 : 0).toFixed(2)}` }}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {{ formatDate(payOrder?.createTime) }}
        </Descriptions.Item>
        <Descriptions.Item label="过期时间">
          {{ formatDate(payOrder?.expireTime) }}
        </Descriptions.Item>
      </Descriptions>
    </Card>
    <Card title="选择支付宝支付" class="mt-4">
      <div class="flex">
        <div
          class="mr-4 w-40 cursor-pointer items-center border-2 border-gray-200 pb-1 pt-4 text-center hover:border-blue-500"
          v-for="channel in channelsAlipay"
          :key="channel.code"
          @click="handlePay(channel.code)"
        >
          <div class="flex items-center justify-center">
            <component :is="channel.icon" class="h-10 w-10" />
          </div>
          <div class="mt-2 pt-1 text-center">{{ channel.name }}</div>
        </div>
      </div>
    </Card>
    <Card title="选择微信支付" class="mt-4">
      <div class="flex">
        <div
          class="mr-4 w-40 cursor-pointer items-center border-2 border-gray-200 pb-1 pt-4 text-center hover:border-blue-500"
          v-for="channel in channelsWechat"
          :key="channel.code"
          @click="handlePay(channel.code)"
        >
          <div class="flex items-center justify-center">
            <component :is="channel.icon" class="h-10 w-10" />
          </div>
          <div class="mt-2 pt-1 text-center">{{ channel.name }}</div>
        </div>
      </div>
    </Card>
    <Card title="选择其它支付" class="mt-4">
      <div class="flex">
        <div
          class="mr-4 w-40 cursor-pointer items-center border-2 border-gray-200 pb-1 pt-4 text-center hover:border-blue-500"
          v-for="channel in channelsMock"
          :key="channel.code"
          @click="handlePay(channel.code)"
        >
          <div class="flex items-center justify-center">
            <component :is="channel.icon" class="h-10 w-10" />
          </div>
          <div class="mt-2 pt-1 text-center">{{ channel.name }}</div>
        </div>
      </div>
    </Card>
  </Page>
</template>
