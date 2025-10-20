<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { EchartsUIType } from '@vben/plugins/echarts';

import type { DataComparisonRespVO } from '#/api/mall/statistics/common';
import type { MallProductStatisticsApi } from '#/api/mall/statistics/product';

import { onMounted, ref } from 'vue';

import { SummaryCard } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { fenToYuan, isSameDay } from '@vben/utils';

import { Button, Card, Col, message, Row, Spin } from 'ant-design-vue';
import dayjs from 'dayjs';

import * as ProductStatisticsApi from '#/api/mall/statistics/product';
import ShortcutDateRangePicker from '#/components/shortcut-date-range-picker/shortcut-date-range-picker.vue';

import { getProductSummaryChartOptions } from './product-summary-chart-options';

/** 商品概况 */
defineOptions({ name: 'ProductSummaryCard' });

const trendLoading = ref(true); // 商品状态加载中
const exportLoading = ref(false); // 导出的加载中
const trendSummary =
  ref<DataComparisonRespVO<MallProductStatisticsApi.ProductStatistics>>(); // 商品状况统计数据
// TODO @AI：searchTimes；参考 /Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/mall/statistics/product/modules/rank-card.vue；这样，可以去掉 shortcutDateRangePicker
const shortcutDateRangePicker = ref();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 计算环比百分比 */
const calculateRelativeRate = (value?: number, reference?: number): string => {
  const refValue = Number(reference || 0);
  const curValue = Number(value || 0);
  if (!refValue || refValue === 0) {
    return '0.00';
  }
  return (((curValue - refValue) / refValue) * 100).toFixed(2);
};

/** 处理商品状况查询 */
const getProductTrendData = async (times?: [Dayjs, Dayjs]) => {
  trendLoading.value = true;
  try {
    // 处理时间: 开始与截止在同一天的, 折线图出不来, 需要延长一天
    let queryTimes = times;
    if (!queryTimes && shortcutDateRangePicker.value?.times) {
      queryTimes = shortcutDateRangePicker.value.times;
    }
    if (queryTimes && isSameDay(queryTimes[0], queryTimes[1])) {
      queryTimes[0] = dayjs(queryTimes[0]).subtract(1, 'd');
    }

    // 查询数据
    await Promise.all([
      getProductTrendSummary(queryTimes),
      getProductStatisticsList(queryTimes),
    ]);
  } finally {
    trendLoading.value = false;
  }
};

/** 查询商品状况数据统计 */
const getProductTrendSummary = async (times?: [Dayjs, Dayjs]) => {
  // TODO @AI：是不是 queryTimes 直接使用 searchTimes 完事？！
  const queryTimes = times
    ? [
        times[0].format('YYYY-MM-DD HH:mm:ss'),
        times[1].format('YYYY-MM-DD HH:mm:ss'),
      ]
    : undefined;
  trendSummary.value = await ProductStatisticsApi.getProductStatisticsAnalyse({
    times: queryTimes,
  });
};

/** 查询商品状况数据列表 */
const getProductStatisticsList = async (times?: [Dayjs, Dayjs]) => {
  // TODO @AI：是不是 queryTimes 直接使用 searchTimes 完事？！
  // 查询数据
  const queryTimes = times
    ? [
        times[0].format('YYYY-MM-DD HH:mm:ss'),
        times[1].format('YYYY-MM-DD HH:mm:ss'),
      ]
    : undefined;
  const list: MallProductStatisticsApi.ProductStatistics[] =
    await ProductStatisticsApi.getProductStatisticsList({ times: queryTimes });

  // 更新 Echarts 数据，数据转换由图表配置处理
  await renderEcharts(getProductSummaryChartOptions(list));
};

/** 导出按钮操作 */
// TODO @AI：导出有问题，参考别的模块的 confirm 更好；
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.confirm({
      content: '确认导出商品状况数据吗？',
      okText: '确定',
      cancelText: '取消',
    });
    // 发起导出
    exportLoading.value = true;
    const times = shortcutDateRangePicker.value?.times;
    const queryTimes = times
      ? [
          times[0].format('YYYY-MM-DD HH:mm:ss'),
          times[1].format('YYYY-MM-DD HH:mm:ss'),
        ]
      : undefined;
    const data = await ProductStatisticsApi.exportProductStatisticsExcel({
      times: queryTimes,
    });

    // 处理下载
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '商品状况.xlsx';
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
  await getProductTrendData();
});
</script>

<template>
  <Card :bordered="false" title="商品概况" class="h-full">
    <template #extra>
      <!-- 查询条件 -->
      <div class="flex items-center gap-2">
        <ShortcutDateRangePicker
          ref="shortcutDateRangePicker"
          @change="getProductTrendData"
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
      <Col :xl="8" :md="8" :sm="24" class="mb-4">
        <SummaryCard
          title="商品浏览量"
          tooltip="在选定条件下，所有商品详情页被访问的次数，一个人在统计时间内访问多次记为多次"
          icon="lucide:eye"
          icon-color="text-blue-500"
          icon-bg-color="bg-blue-100"
          :decimals="0"
          :value="trendSummary?.value?.browseCount || 0"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.browseCount,
              trendSummary?.reference?.browseCount,
            )
          "
        />
      </Col>
      <Col :xl="8" :md="8" :sm="24" class="mb-4">
        <SummaryCard
          title="商品访客数"
          tooltip="在选定条件下，访问任何商品详情页的人数，一个人在统计时间范围内访问多次只记为一个"
          icon="lucide:users"
          icon-color="text-purple-500"
          icon-bg-color="bg-purple-100"
          :decimals="0"
          :value="trendSummary?.value?.browseUserCount || 0"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.browseUserCount,
              trendSummary?.reference?.browseUserCount,
            )
          "
        />
      </Col>

      <Col :xl="8" :md="8" :sm="24" class="mb-4">
        <SummaryCard
          title="支付件数"
          tooltip="在选定条件下，成功付款订单的商品件数之和"
          icon="lucide:credit-card"
          icon-color="text-yellow-500"
          icon-bg-color="bg-yellow-100"
          :decimals="0"
          :value="trendSummary?.value?.orderPayCount || 0"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.orderPayCount,
              trendSummary?.reference?.orderPayCount,
            )
          "
        />
      </Col>
      <Col :xl="8" :md="8" :sm="24" class="mb-4">
        <SummaryCard
          title="支付金额"
          tooltip="在选定条件下，成功付款订单的商品金额之和"
          icon="lucide:banknote"
          icon-color="text-green-500"
          icon-bg-color="bg-green-100"
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
      <Col :xl="8" :md="8" :sm="24" class="mb-4">
        <SummaryCard
          title="退款件数"
          tooltip="在选定条件下，成功退款的商品件数之和"
          icon="lucide:wallet"
          icon-color="text-cyan-500"
          icon-bg-color="bg-cyan-100"
          :decimals="0"
          :value="trendSummary?.value?.afterSaleCount || 0"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.afterSaleCount,
              trendSummary?.reference?.afterSaleCount,
            )
          "
        />
      </Col>

      <Col :xl="8" :md="8" :sm="24" class="mb-4">
        <SummaryCard
          title="退款金额"
          tooltip="在选定条件下，成功退款的商品金额之和"
          icon="lucide:receipt"
          icon-color="text-orange-500"
          icon-bg-color="bg-orange-100"
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
    <Spin :spinning="trendLoading">
      <EchartsUI ref="chartRef" />
    </Spin>
  </Card>
</template>
