<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';

import type { MallDataComparisonResp } from '#/api/mall/statistics/common';
import type { MallTradeStatisticsApi } from '#/api/mall/statistics/trade';

import { onMounted, ref } from 'vue';

import { AnalysisOverview, DocAlert, Page } from '@vben/common-ui';
import { SvgCakeIcon, SvgCardIcon } from '@vben/icons';

import * as TradeStatisticsApi from '#/api/mall/statistics/trade';

import TradeTransactionCard from './components/trade-transaction-card.vue';

const overviewItems = ref<AnalysisOverviewItem[]>();
const summary =
  ref<MallDataComparisonResp<MallTradeStatisticsApi.TradeSummary>>();
const loadOverview = () => {
  overviewItems.value = [
    {
      icon: SvgCakeIcon,
      title: '昨日订单数量',
      value: summary.value?.value?.yesterdayOrderCount || 0,
      tooltip: '昨日订单数量',
      totalValue: summary?.value?.reference?.yesterdayOrderCount,
      showGrowthRate: true,
    },
    {
      icon: SvgCakeIcon,
      title: '本月订单数量',
      value: summary.value?.value?.monthOrderCount || 0,
      tooltip: '本月订单数量',
      totalValue: summary?.value?.reference?.monthOrderCount,
      showGrowthRate: true,
    },
    {
      icon: SvgCardIcon,
      title: '昨日支付金额',
      value: summary.value?.value?.yesterdayPayPrice || 0,
      tooltip: '昨日支付金额',
      totalValue: summary?.value?.reference?.yesterdayPayPrice,
      showGrowthRate: true,
    },
    {
      icon: SvgCardIcon,
      title: '本月支付金额',
      value: summary.value?.value?.monthPayPrice || 0,
      tooltip: '本月支付金额',
      totalValue: summary?.value?.reference?.monthPayPrice,
      showGrowthRate: true,
    },
  ];
};

/** 查询交易统计 */
const getTradeStatisticsSummary = async () => {
  summary.value = await TradeStatisticsApi.getTradeStatisticsSummary();
};

/** 初始化 */
onMounted(async () => {
  await getTradeStatisticsSummary();
  loadOverview();
});
</script>

<template>
  <Page>
    <DocAlert
      title="【统计】会员、商品、交易统计"
      url="https://doc.iocoder.cn/mall/statistics/"
    />
    <!-- 统计值 -->
    <div class="mb-4 mt-5 w-full md:flex">
      <AnalysisOverview
        v-model:model-value="overviewItems"
        class="mt-5 md:mr-4 md:mt-0 md:w-full"
      />
    </div>
    <div class="mb-4 mt-5 w-full md:flex">
      <TradeTransactionCard class="mt-5 md:mr-4 md:mt-0 md:w-full" />
    </div>
  </Page>
</template>
