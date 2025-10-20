<script lang="ts" setup>
import { onActivated, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';

import { CountTo } from '@vben/common-ui';

import { ElCard } from 'element-plus';

import * as ProductSpuApi from '#/api/mall/product/spu';
import * as PayStatisticsApi from '#/api/mall/statistics/pay';
import * as TradeStatisticsApi from '#/api/mall/statistics/trade';

/** 运营数据卡片 */
defineOptions({ name: 'OperationDataCard' });

const router = useRouter();

/** 数据项接口 */
interface DataItem {
  name: string;
  value: number;
  routerPath: string;
  prefix?: string;
  decimals?: number;
}

/** 数据 */
const data = reactive({
  orderUndelivered: {
    name: '待发货订单',
    value: 0,
    routerPath: '/mall/trade/order',
  },
  orderAfterSaleApply: {
    name: '退款中订单',
    value: 0,
    routerPath: '/mall/trade/after-sale',
  },
  orderWaitePickUp: {
    name: '待核销订单',
    value: 0,
    routerPath: '/mall/trade/delivery/pick-up-store/pick-up-order',
  },
  productAlertStock: {
    name: '库存预警',
    value: 0,
    routerPath: '/mall/product/spu',
  },
  productForSale: {
    name: '上架商品',
    value: 0,
    routerPath: '/mall/product/spu',
  },
  productInWarehouse: {
    name: '仓库商品',
    value: 0,
    routerPath: '/mall/product/spu',
  },
  withdrawAuditing: {
    name: '提现待审核',
    value: 0,
    routerPath: '/mall/trade/brokerage/brokerage-withdraw',
  },
  rechargePrice: {
    name: '账户充值',
    value: 0,
    prefix: '￥',
    decimals: 2,
    routerPath: '/pay/wallet/wallet-balance',
  },
});

/** 查询订单数据 */
async function getOrderData() {
  const orderCount = await TradeStatisticsApi.getOrderCount();
  if (orderCount.undelivered) {
    data.orderUndelivered.value = orderCount.undelivered;
  }
  if (orderCount.afterSaleApply) {
    data.orderAfterSaleApply.value = orderCount.afterSaleApply;
  }
  if (orderCount.pickUp) {
    data.orderWaitePickUp.value = orderCount.pickUp;
  }
  if (orderCount.auditingWithdraw) {
    data.withdrawAuditing.value = orderCount.auditingWithdraw;
  }
}

/** 查询商品数据 */
async function getProductData() {
  const productCount = await ProductSpuApi.getTabsCount();
  data.productForSale.value = productCount['0'] || 0;
  data.productInWarehouse.value = productCount['1'] || 0;
  data.productAlertStock.value = productCount['3'] || 0;
}

/** 查询钱包充值数据 */
async function getWalletRechargeData() {
  const paySummary = await PayStatisticsApi.getWalletRechargePrice();
  data.rechargePrice.value = paySummary.rechargePrice;
}

/** 跳转到对应页面 */
function handleClick(routerPath: string) {
  router.push({ path: routerPath });
}

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
  <ElCard :border="false">
    <template #header>
      <div>运营数据</div>
    </template>
    <div class="flex flex-row flex-wrap items-center gap-8 p-4">
      <div
        v-for="(item, key) in data"
        :key="key"
        class="flex h-20 w-[20%] cursor-pointer flex-col items-center justify-center gap-2"
        @click="handleClick(item.routerPath)"
      >
        <CountTo
          :decimals="(item as DataItem).decimals ?? 0"
          :end-val="item.value"
          :prefix="(item as DataItem).prefix ?? ''"
          class="text-3xl"
        />
        <span class="text-center">{{ item.name }}</span>
      </div>
    </div>
  </ElCard>
</template>
