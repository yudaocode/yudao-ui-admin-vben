<script lang="ts" setup>
import type { MallKefuMessageApi } from '#/api/mall/promotion/kefu/message';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { fenToYuan, isObject, jsonParse } from '@vben/utils';

import ProductItem from './product-item.vue';

const props = defineProps<{
  message?: MallKefuMessageApi.Message;
  order?: any;
}>();

const { push } = useRouter();

const getMessageContent = computed(() =>
  props.message === undefined
    ? props.order
    : jsonParse(props!.message!.content),
);

/** 查看订单详情 */
function openDetail(id: number) {
  push({ name: 'TradeOrderDetail', params: { id } });
}

/**
 * 格式化订单状态的颜色
 *
 * @param order 订单
 * @return {string} 颜色的 class 名称
 */
function formatOrderColor(order: any) {
  if (order.status === 0) {
    return 'text-[#999]';
  }
  if (
    order.status === 10 ||
    order.status === 20 ||
    (order.status === 30 && !order.commentStatus)
  ) {
    return 'text-[#faad14]';
  }
  if (order.status === 30 && order.commentStatus) {
    return 'text-[#52c41a]';
  }
  return 'text-[#ff3000]';
}

/**
 * 格式化订单状态
 *
 * @param order 订单
 */
function formatOrderStatus(order: any) {
  if (order.status === 0) {
    return '待付款';
  }
  if (order.status === 10 && order.deliveryType === 1) {
    return '待发货';
  }
  if (order.status === 10 && order.deliveryType === 2) {
    return '待核销';
  }
  if (order.status === 20) {
    return '待收货';
  }
  if (order.status === 30 && !order.commentStatus) {
    return '待评价';
  }
  if (order.status === 30 && order.commentStatus) {
    return '已完成';
  }
  return '已关闭';
}
</script>

<template>
  <div
    v-if="isObject(getMessageContent)"
    :key="getMessageContent.id"
    class="mb-[10px] rounded-[10px] bg-gray-500/30 p-[10px]"
  >
    <div class="flex h-[28px] items-center justify-between px-[5px] font-bold">
      <div class="text-[13px]">
        订单号：
        <span
          class="cursor-pointer hover:text-[var(--left-menu-bg-active-color)] hover:underline"
          @click="openDetail(getMessageContent.id)"
        >
          {{ getMessageContent.no }}
        </span>
      </div>
      <div
        :class="formatOrderColor(getMessageContent)"
        class="text-[13px] font-bold"
      >
        {{ formatOrderStatus(getMessageContent) }}
      </div>
    </div>
    <div
      v-for="item in getMessageContent.items"
      :key="item.id"
      class="border-b"
    >
      <ProductItem
        :num="item.count"
        :pic-url="item.picUrl"
        :price="item.price"
        :sku-text="
          item.properties.map((property: any) => property.valueName).join(' ')
        "
        :spu-id="item.spuId"
        :title="item.spuName"
      />
    </div>
    <div class="flex justify-end pr-[5px] pt-[10px] font-bold">
      <div class="flex items-center">
        <div class="text-[13px] leading-normal">
          共 {{ getMessageContent?.productCount }} 件商品,总金额:
        </div>
        <div class="font-[OPPOSANS] text-[13px] leading-normal">
          ￥{{ fenToYuan(getMessageContent?.payPrice) }}
        </div>
      </div>
    </div>
  </div>
</template>
