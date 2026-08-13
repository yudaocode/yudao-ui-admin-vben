<script lang="ts" setup>
import type { EChartsOption } from '@vben/plugins/echarts';

import type { FmsHomeApi } from '#/api/fms/home';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Empty, Spin } from 'ant-design-vue';

import { FMS_HOME_METRIC_COLORS } from '#/views/fms/utils/constants';
import { formatAmount } from '#/views/fms/utils/format';

defineOptions({ name: 'FmsHomeMetricCharts' });

const props = defineProps<{
  home?: FmsHomeApi.Home;
  loading: boolean;
  metricDetail?: FmsHomeApi.HomeMetricDetail;
  selectedMetricKey?: string;
}>();

const trendChartOptions = computed<EChartsOption>(() => {
  const commonOptions: EChartsOption = {
    color: FMS_HOME_METRIC_COLORS,
    grid: { left: 16, right: 24, top: 48, bottom: 12, containLabel: true },
    legend: { top: 0 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => formatAmount(Number(value)),
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value: number) => formatCompactAmount(value) },
    },
  };
  if (props.metricDetail) {
    return {
      ...commonOptions,
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: props.metricDetail.trends.map((item) => item.month),
      },
      series: [
        {
          name: props.metricDetail.name,
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.12 },
          data: props.metricDetail.trends.map((item) => item.amount),
        },
      ],
    };
  }
  return {
    ...commonOptions,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.home?.trends.map((item) => item.month) || [],
    },
    series: (props.home?.metrics || []).map((metric) => ({
      name: metric.name,
      type: 'line' as const,
      smooth: true,
      data: (props.home?.trends || []).map(
        (trend) =>
          trend.metrics.find((item) => item.key === metric.key)?.amount || 0,
      ),
    })),
  };
}); // 趋势图配置
const structureChartData = computed(() => buildStructureChartData()); // 科目构成图数据
const structureChartOptions = computed<EChartsOption>(() => ({
  color: FMS_HOME_METRIC_COLORS,
  tooltip: {
    trigger: 'item',
    valueFormatter: (value) => formatAmount(Number(value)),
  },
  legend: { bottom: 0 },
  series: [
    {
      name: '本期指标',
      type: 'pie',
      radius: ['46%', '72%'],
      center: ['50%', '44%'],
      label: { formatter: '{b}\n{d}%' },
      data: structureChartData.value,
    },
  ],
})); // 科目构成图配置

const trendChartRef = ref(); // 趋势图组件
const { renderEcharts: renderTrendChart } = useEcharts(trendChartRef);
const structureChartRef = ref(); // 科目构成图组件
const { renderEcharts: renderStructureChart } = useEcharts(structureChartRef);

/** 渲染趋势图 */
async function renderTrend() {
  await nextTick();
  await renderTrendChart(trendChartOptions.value);
}

/** 渲染科目构成图 */
async function renderStructure() {
  if (structureChartData.value.length === 0) return;
  await nextTick();
  await renderStructureChart(structureChartOptions.value);
}

watch(trendChartOptions, renderTrend);
watch([structureChartOptions, structureChartData], renderStructure);

/** 初始化 */
onMounted(() => {
  renderTrend();
  renderStructure();
});

/** 构建科目构成图数据 */
function buildStructureChartData() {
  if (!props.metricDetail) {
    return (props.home?.metrics || [])
      .filter((metric) => Number(metric.amount) > 0)
      .map((metric) => ({
        name: metric.name,
        value: Number(metric.amount),
      }));
  }
  const structure = props.metricDetail.structure
    .filter((item) => Number(item.amount) > 0)
    .map((item) => ({
      name: `${item.subjectCode} ${item.subjectName}`,
      value: Number(item.amount),
    }));
  if (structure.length === 0) {
    const metric = props.home?.metrics.find(
      (item) => item.key === props.selectedMetricKey,
    );
    return metric && Number(metric.amount) > 0
      ? [{ name: metric.name, value: Number(metric.amount) }]
      : [];
  }
  const result = structure.slice(0, 5);
  if (structure.length > 5) {
    result.push({
      name: '其他',
      value: structure.slice(5).reduce((total, item) => total + item.value, 0),
    });
  }
  return result;
}

/** 格式化坐标轴金额 */
function formatCompactAmount(amount: number) {
  const value = Number(amount || 0);
  if (Math.abs(value) >= 10_000) return `${(value / 10_000).toFixed(1)}万`;
  return value.toFixed(0);
}

/** 格式化当前会计期间的月份文案 */
function formatCurrentMonth() {
  const month = Number(props.home?.currentMonth?.slice(5, 7));
  return month ? `${month}月` : '';
}
</script>

<template>
  <Spin :spinning="loading">
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <div class="xl:col-span-3">
        <div class="mb-4 text-[16px] font-semibold">
          {{
            metricDetail
              ? `${metricDetail.name}变化趋势（单位：元）`
              : '财务指标趋势（单位：元）'
          }}
        </div>
        <EchartsUI ref="trendChartRef" height="360px" />
      </div>
      <div class="xl:col-span-2">
        <div class="mb-4 text-[16px] font-semibold">
          {{
            metricDetail
              ? `${formatCurrentMonth()} ${metricDetail.name}结构分析（单位：元）`
              : '本期指标结构（单位：元）'
          }}
        </div>
        <EchartsUI
          v-if="structureChartData.length > 0"
          ref="structureChartRef"
          height="360px"
        />
        <div v-else class="flex h-[360px] items-center justify-center">
          <Empty description="暂无科目构成数据" />
        </div>
      </div>
    </div>
  </Spin>
</template>
