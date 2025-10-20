<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { EchartsUIType } from '@vben/plugins/echarts';

import type { DataComparisonRespVO } from '#/api/mall/statistics/common';
import type { MallTradeStatisticsApi } from '#/api/mall/statistics/trade';

import { onMounted, ref } from 'vue';

import { SummaryCard } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { fenToYuan } from '@vben/utils';

import { Button, Card, Col, message, Row, Skeleton } from 'ant-design-vue';
import dayjs from 'dayjs';

import * as TradeStatisticsApi from '#/api/mall/statistics/trade';
import ShortcutDateRangePicker from '#/components/shortcut-date-range-picker/shortcut-date-range-picker.vue';

import { getTradeTrendChartOptions } from './trade-trend-chart-options';

/** 交易趋势 */
defineOptions({ name: 'TradeTrendCard' });

const trendLoading = ref(true); // 交易状态加载中
const exportLoading = ref(false); // 导出的加载中
const trendSummary =
  ref<DataComparisonRespVO<MallTradeStatisticsApi.TradeTrendSummary>>(); // 交易状况统计数据
const shortcutDateRangePicker = ref();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 计算环比百分比 */
const calculateRelativeRate = (value?: number, reference?: number): string => {
  const refValue = Number(reference || 0);
  const curValue = Number(value || 0);
  if (!refValue || refValue === 0) return '0.00';
  return (((curValue - refValue) / refValue) * 100).toFixed(2);
};

/** 处理交易状况查询 */
const getTradeTrendData = async (times?: [Dayjs, Dayjs]) => {
  trendLoading.value = true;
  try {
    let queryTimes = times;
    if (!queryTimes && shortcutDateRangePicker.value?.times) {
      queryTimes = shortcutDateRangePicker.value.times;
    }

    // 1. 处理时间: 开始与截止在同一天的, 折线图出不来, 需要延长一天
    if (queryTimes && isSameDay(queryTimes[0], queryTimes[1])) {
      // 前天
      queryTimes[0] = dayjs(queryTimes[0]).subtract(1, 'd');
    }

    // 查询数据
    await Promise.all([
      getTradeStatisticsAnalyse(queryTimes),
      getTradeStatisticsList(queryTimes),
    ]);
  } finally {
    trendLoading.value = false;
  }
};

/** 判断是否同一天 */
const isSameDay = (date1: Dayjs, date2: Dayjs): boolean => {
  return date1.format('YYYY-MM-DD') === date2.format('YYYY-MM-DD');
};

/** 查询交易状况数据统计 */
const getTradeStatisticsAnalyse = async (times?: [Dayjs, Dayjs]) => {
  const queryTimes = times
    ? { times: [times[0].toDate(), times[1].toDate()] }
    : undefined;
  trendSummary.value = await TradeStatisticsApi.getTradeStatisticsAnalyse(
    queryTimes as any,
  );
};

/** 查询交易状况数据列表 */
const getTradeStatisticsList = async (times?: [Dayjs, Dayjs]) => {
  // 查询数据
  const queryTimes = times
    ? { times: [times[0].toDate(), times[1].toDate()] }
    : undefined;
  const list: MallTradeStatisticsApi.TradeTrendSummary[] =
    await TradeStatisticsApi.getTradeStatisticsList(queryTimes as any);

  // 处理数据
  const processedList = list.map((item) => ({
    ...item,
    turnoverPrice: Number(fenToYuan(item.turnoverPrice)),
    orderPayPrice: Number(fenToYuan(item.orderPayPrice)),
    rechargePrice: Number(fenToYuan(item.rechargePrice)),
    expensePrice: Number(fenToYuan(item.expensePrice)),
  }));

  // 更新 Echarts 数据
  await renderEcharts(getTradeTrendChartOptions(processedList));
};

// TODO @AI：导出
/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.confirm({
      content: '确认导出交易状况数据吗？',
      okText: '确定',
      cancelText: '取消',
    });
    // 发起导出
    exportLoading.value = true;
    const times = shortcutDateRangePicker.value?.times;
    const queryTimes = times
      ? { times: [times[0].toDate(), times[1].toDate()] }
      : undefined;
    const data = await TradeStatisticsApi.exportTradeStatisticsExcel(
      queryTimes as any,
    );

    // 处理下载
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '交易状况.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch {
    // 用户取消导出
  } finally {
    exportLoading.value = false;
  }
};

/** 初始化 */
onMounted(async () => {
  await getTradeTrendData();
});
</script>

<template>
  <Card :bordered="false" title="交易状况" class="h-full">
    <template #extra>
      <!-- 查询条件 -->
      <div class="flex items-center gap-2">
        <ShortcutDateRangePicker
          ref="shortcutDateRangePicker"
          @change="getTradeTrendData"
        >
          <Button class="ml-4" @click="handleExport" :loading="exportLoading">
            <template #icon>
              <IconifyIcon icon="lucide:download" />
            </template>
            导出
          </Button>
        </ShortcutDateRangePicker>
      </div>
    </template>

    <!-- 统计值 -->
    <Row :gutter="16" class="mb-4">
      <Col :md="6" :sm="12" :xs="24" class="mb-4">
        <SummaryCard
          title="营业额"
          tooltip="商品支付金额、充值金额"
          icon="lucide:banknote"
          icon-color="text-blue-500"
          icon-bg-color="bg-blue-100"
          prefix="￥"
          :decimals="2"
          :value="Number(fenToYuan(trendSummary?.value?.turnoverPrice || 0))"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.turnoverPrice,
              trendSummary?.reference?.turnoverPrice,
            )
          "
        />
      </Col>

      <Col :md="6" :sm="12" :xs="24" class="mb-4">
        <SummaryCard
          title="商品支付金额"
          tooltip="用户购买商品的实际支付金额，包括微信支付、余额支付、支付宝支付、线下支付金额（拼团商品在成团之后计入，线下支付订单在后台确认支付后计入）"
          icon="lucide:shopping-cart"
          icon-color="text-purple-500"
          icon-bg-color="bg-purple-100"
          prefix="￥"
          :decimals="2"
          :value="Number(fenToYuan(trendSummary?.value?.orderPayPrice || 0))"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.orderPayPrice,
              trendSummary?.reference?.orderPayPrice,
            )
          "
        />
      </Col>

      <Col :md="6" :sm="12" :xs="24" class="mb-4">
        <SummaryCard
          title="充值金额"
          tooltip="用户成功充值的金额"
          icon="lucide:credit-card"
          icon-color="text-yellow-500"
          icon-bg-color="bg-yellow-100"
          prefix="￥"
          :decimals="2"
          :value="Number(fenToYuan(trendSummary?.value?.rechargePrice || 0))"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.rechargePrice,
              trendSummary?.reference?.rechargePrice,
            )
          "
        />
      </Col>
      <Col :md="6" :sm="12" :xs="24" class="mb-4">
        <SummaryCard
          title="支出金额"
          tooltip="余额支付金额、支付佣金金额、商品退款金额"
          icon="lucide:trending-down"
          icon-color="text-green-500"
          icon-bg-color="bg-green-100"
          prefix="￥"
          :decimals="2"
          :value="Number(fenToYuan(trendSummary?.value?.expensePrice || 0))"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.expensePrice,
              trendSummary?.reference?.expensePrice,
            )
          "
        />
      </Col>
      <Col :md="6" :sm="12" :xs="24" class="mb-4">
        <SummaryCard
          title="余额支付金额"
          tooltip="用户下单时使用余额实际支付的金额"
          icon="lucide:wallet"
          icon-color="text-cyan-500"
          icon-bg-color="bg-cyan-100"
          prefix="￥"
          :decimals="2"
          :value="Number(fenToYuan(trendSummary?.value?.walletPayPrice || 0))"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.walletPayPrice,
              trendSummary?.reference?.walletPayPrice,
            )
          "
        />
      </Col>
      <Col :md="6" :sm="12" :xs="24" class="mb-4">
        <SummaryCard
          title="支付佣金金额"
          tooltip="后台给推广员支付的推广佣金，以实际支付为准"
          icon="lucide:gift"
          icon-color="text-orange-500"
          icon-bg-color="bg-orange-100"
          prefix="￥"
          :decimals="2"
          :value="
            Number(
              fenToYuan(trendSummary?.value?.brokerageSettlementPrice || 0),
            )
          "
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.brokerageSettlementPrice,
              trendSummary?.reference?.brokerageSettlementPrice,
            )
          "
        />
      </Col>

      <Col :md="6" :sm="12" :xs="24" class="mb-4">
        <SummaryCard
          title="商品退款金额"
          tooltip="用户成功退款的商品金额"
          icon="lucide:undo-2"
          icon-color="text-red-500"
          icon-bg-color="bg-red-100"
          prefix="￥"
          :decimals="2"
          :value="
            Number(fenToYuan(trendSummary?.value?.afterSaleRefundPrice || 0))
          "
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.afterSaleRefundPrice,
              trendSummary?.reference?.afterSaleRefundPrice,
            )
          "
        />
      </Col>
    </Row>

    <!-- 折线图 -->
    <Skeleton :loading="trendLoading" :active="true">
      <EchartsUI ref="chartRef" class="h-[500px]" />
    </Skeleton>
  </Card>
</template>
