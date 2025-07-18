<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { MallDataComparisonResp } from '#/api/mall/statistics/common';
import type { MallProductStatisticsApi } from '#/api/mall/statistics/product';

import { reactive, ref } from 'vue';

import { AnalysisChartCard, AnalysisOverview, confirm } from '@vben/common-ui';
import { SvgCakeIcon, SvgCardIcon, SvgEyeIcon } from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import {
  downloadFileFromBlobPart,
  fenToYuan,
  formatDate,
  isSameDay,
} from '@vben/utils';

import dayjs from 'dayjs';

import * as ProductStatisticsApi from '#/api/mall/statistics/product';
import ShortcutDateRangePicker from '#/views/mall/home/components/shortcut-date-range-picker.vue';

/** 商品概况 */
defineOptions({ name: 'ProductSummary' });

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const trendLoading = ref(true); // 商品状态加载中
const exportLoading = ref(false); // 导出的加载中
const trendSummary =
  ref<MallDataComparisonResp<MallProductStatisticsApi.ProductStatistics>>(); // 商品状况统计数据
const shortcutDateRangePicker = ref();

/** 折线图配置 */
const lineChartOptions = reactive({
  dataset: {
    dimensions: [
      'time',
      'browseCount',
      'browseUserCount',
      'orderPayPrice',
      'afterSaleRefundPrice',
    ],
    source: [] as MallProductStatisticsApi.ProductStatistics[],
  },
  grid: {
    left: 20,
    right: 20,
    bottom: 20,
    top: 80,
    containLabel: true,
  },
  legend: {
    top: 50,
  },
  series: [
    {
      name: '商品浏览量',
      type: 'line',
      smooth: true,
      itemStyle: { color: '#B37FEB' },
    },
    {
      name: '商品访客数',
      type: 'line',
      smooth: true,
      itemStyle: { color: '#FFAB2B' },
    },
    {
      name: '支付金额',
      type: 'bar',
      smooth: true,
      yAxisIndex: 1,
      itemStyle: { color: '#1890FF' },
    },
    {
      name: '退款金额',
      type: 'bar',
      smooth: true,
      yAxisIndex: 1,
      itemStyle: { color: '#00C050' },
    },
  ],
  toolbox: {
    feature: {
      // 数据区域缩放
      dataZoom: {
        yAxisIndex: false, // Y轴不缩放
      },
      brush: {
        type: ['lineX', 'clear'] as const, // 区域缩放按钮、还原按钮
      },
      saveAsImage: { show: true, name: '商品状况' }, // 保存为图片
    },
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
    padding: [5, 10],
  },
  xAxis: {
    type: 'category' as const,
    boundaryGap: true,
    axisTick: {
      show: false,
    },
  },
  yAxis: [
    {
      type: 'value' as const,
      name: '金额',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#7F8B9C',
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#F5F7F9',
        },
      },
    },
    {
      type: 'value' as const,
      name: '数量',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#7F8B9C',
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#F5F7F9',
        },
      },
    },
  ],
});

/** 处理商品状况查询 */
const getProductTrendData = async () => {
  trendLoading.value = true;
  // 1. 处理时间: 开始与截止在同一天的, 折线图出不来, 需要延长一天
  const times = shortcutDateRangePicker.value.times;
  if (isSameDay(times[0], times[1])) {
    // 前天
    times[0] = formatDate(dayjs(times[0]).subtract(1, 'd').toDate());
  }
  // 查询数据
  await Promise.all([getProductTrendSummary(), getProductStatisticsList()]);
  renderEcharts(lineChartOptions as unknown as echarts.EChartsOption);
  loadOverview();
  trendLoading.value = false;
};

/** 查询商品状况数据统计 */
const getProductTrendSummary = async () => {
  const times = shortcutDateRangePicker.value.times;
  trendSummary.value = await ProductStatisticsApi.getProductStatisticsAnalyse({
    times,
  });
};

/** 查询商品状况数据列表 */
const getProductStatisticsList = async () => {
  // 查询数据
  const times = shortcutDateRangePicker.value.times;
  const list: MallProductStatisticsApi.ProductStatistics[] =
    await ProductStatisticsApi.getProductStatisticsList({ times });
  // 处理数据
  for (const item of list) {
    item.orderPayPrice = Number(fenToYuan(item.orderPayPrice));
    item.afterSaleRefundPrice = Number(fenToYuan(item.afterSaleRefundPrice));
  }
  // 更新 Echarts 数据
  if (lineChartOptions.dataset && lineChartOptions.dataset.source) {
    lineChartOptions.dataset.source = list;
  }
};

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await confirm('确定要导出商品状况吗？');
    // 发起导出
    exportLoading.value = true;
    const times = shortcutDateRangePicker.value.times;
    const data = await ProductStatisticsApi.exportProductStatisticsExcel({
      times,
    });
    downloadFileFromBlobPart({ fileName: '商品状况.xls', source: data });
  } finally {
    exportLoading.value = false;
  }
};

const overviewItems = ref<AnalysisOverviewItem[]>();
const loadOverview = () => {
  overviewItems.value = [
    {
      icon: SvgEyeIcon,
      title: '商品浏览量',
      totalTitle: '昨日数据',
      totalValue: trendSummary.value?.reference?.browseCount || 0,
      value: trendSummary.value?.value?.browseCount || 0,
      tooltip:
        '在选定条件下，所有商品详情页被访问的次数，一个人在统计时间内访问多次记为多次',
      showGrowthRate: true,
    },
    {
      icon: SvgCakeIcon,
      title: '商品访客数',
      totalTitle: '昨日数据',
      totalValue: trendSummary.value?.reference?.browseUserCount || 0,
      value: trendSummary.value?.value?.browseUserCount || 0,
      tooltip:
        '在选定条件下，访问任何商品详情页的人数，一个人在统计时间范围内访问多次只记为一个',
      showGrowthRate: true,
    },
    {
      icon: SvgCakeIcon,
      title: '支付件数',
      totalTitle: '昨日数据',
      totalValue: trendSummary.value?.reference?.orderPayCount || 0,
      value: trendSummary.value?.value?.orderPayCount || 0,
      tooltip: '在选定条件下，成功付款订单的商品件数之和',
      showGrowthRate: true,
    },
    {
      icon: SvgCardIcon,
      title: '支付金额',
      totalTitle: '昨日数据',
      totalValue: trendSummary.value?.reference?.afterSaleCount || 0,
      value: trendSummary.value?.value?.orderPayPrice || 0,
      tooltip: '在选定条件下，成功付款订单的商品金额之和',
      showGrowthRate: true,
    },
    {
      icon: SvgCakeIcon,
      title: '退款件数',
      totalTitle: '昨日数据',
      totalValue: trendSummary.value?.reference?.afterSaleCount || 0,
      value: trendSummary.value?.value?.afterSaleCount || 0,
      tooltip: '在选定条件下，成功退款的商品件数之和',
      showGrowthRate: true,
    },
    {
      icon: SvgCardIcon,
      title: '退款金额',
      totalTitle: '昨日数据',
      totalValue: trendSummary.value?.reference?.afterSaleRefundPrice || 0,
      value: trendSummary.value?.value?.afterSaleRefundPrice || 0,
      tooltip: '在选定条件下，成功退款的商品金额之和',
      showGrowthRate: true,
    },
  ];
};
</script>
<template>
  <AnalysisChartCard title="商品概况">
    <template #header-suffix>
      <!-- 查询条件 -->
      <ShortcutDateRangePicker
        ref="shortcutDateRangePicker"
        @change="getProductTrendData"
      >
        <el-button
          class="ml-4"
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['statistics:product:export']"
        >
          <Icon icon="ep:download" class="mr-1" />导出
        </el-button>
      </ShortcutDateRangePicker>
    </template>
    <!-- 统计值 -->
    <AnalysisOverview
      v-model:model-value="overviewItems"
      :columns-number="6"
      class="mt-5 md:mr-4 md:mt-0 md:w-full"
    />
    <!-- 折线图 -->
    <el-skeleton :loading="trendLoading" animated>
      <EchartsUI ref="chartRef" height="500px" />
    </el-skeleton>
  </AnalysisChartCard>
</template>
<style lang="scss" scoped></style>
