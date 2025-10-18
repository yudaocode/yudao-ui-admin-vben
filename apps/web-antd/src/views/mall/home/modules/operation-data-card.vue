<script lang="ts" setup>
import { onActivated, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';

import { Card } from 'ant-design-vue';

import { CountTo } from '@vben/common-ui';

import * as ProductSpuApi from '#/api/mall/product/spu';
import * as PayStatisticsApi from '#/api/mall/statistics/pay';
import * as TradeStatisticsApi from '#/api/mall/statistics/trade';

/** 运营数据卡片 */
defineOptions({ name: 'OperationDataCard' });

const router = useRouter();

/** 数据 */
const data = reactive({
  orderUndelivered: { name: '待发货订单', value: 0, routerName: 'TradeOrder' },
  orderAfterSaleApply: {
    name: '退款中订单',
    value: 0,
    routerName: 'TradeAfterSale',
  },
  orderWaitePickUp: { name: '待核销订单', value: 0, routerName: 'TradeOrder' },
  productAlertStock: { name: '库存预警', value: 0, routerName: 'ProductSpu' },
  productForSale: { name: '上架商品', value: 0, routerName: 'ProductSpu' },
  productInWarehouse: { name: '仓库商品', value: 0, routerName: 'ProductSpu' },
  withdrawAuditing: {
    name: '提现待审核',
    value: 0,
    routerName: 'TradeBrokerageWithdraw',
  },
  rechargePrice: {
    name: '账户充值',
    value: 0.0,
    prefix: '￥',
    decimals: 2,
    routerName: 'PayWalletRecharge',
  },
});

/** 查询订单数据 */
const getOrderData = async () => {
  const orderCount = await TradeStatisticsApi.getOrderCount();
  if (orderCount.undelivered != null) {
    data.orderUndelivered.value = orderCount.undelivered;
  }
  if (orderCount.afterSaleApply != null) {
    data.orderAfterSaleApply.value = orderCount.afterSaleApply;
  }
  if (orderCount.pickUp != null) {
    data.orderWaitePickUp.value = orderCount.pickUp;
  }
  if (orderCount.auditingWithdraw != null) {
    data.withdrawAuditing.value = orderCount.auditingWithdraw;
  }
};

/** 查询商品数据 */
const getProductData = async () => {
  const productCount = await ProductSpuApi.getTabsCount();
  data.productForSale.value = productCount['0'];
  data.productInWarehouse.value = productCount['1'];
  data.productAlertStock.value = productCount['3'];
};

/** 查询钱包充值数据 */
const getWalletRechargeData = async () => {
  const paySummary = await PayStatisticsApi.getWalletRechargePrice();
  data.rechargePrice.value = paySummary.rechargePrice;
};

/**
 * 跳转到对应页面
 *
 * @param routerName 路由页面组件的名称
 */
const handleClick = (routerName: string) => {
  router.push({ name: routerName });
};

/** 激活时 */
onActivated(() => {
  getOrderData();
  getProductData();
  getWalletRechargeData();
});

/** 初始化 */
onMounted(() => {
  getOrderData();
  getProductData();
  getWalletRechargeData();
});
</script>

<template>
  <Card :bordered="false" title="运营数据">
    <div class="flex flex-row flex-wrap items-center gap-8 p-4">
      <div
        v-for="item in data"
        :key="item.name"
        class="flex h-20 w-[20%] cursor-pointer flex-col items-center justify-center gap-2"
        @click="handleClick(item.routerName)"
      >
        <CountTo
          :decimals="item.decimals || 0"
          :end-val="item.value"
          :prefix="item.prefix || ''"
          class="text-3xl"
        />
        <span class="text-center">{{ item.name }}</span>
      </div>
    </div>
  </Card>
</template>

