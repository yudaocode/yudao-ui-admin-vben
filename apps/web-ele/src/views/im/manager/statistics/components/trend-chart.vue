<script lang="ts" setup>
import type { EChartsOption, EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { ElCard, ElOption, ElSelect } from 'element-plus'

import {
  getMessageTrend,
  getUserTrend,
} from '#/api/im/manager/statistics';

const props = defineProps<{
  type: 'message' | 'user';
}>();

const title =
  props.type === 'message'
    ? '消息趋势（私聊 + 群聊）'
    : '用户趋势（新增注册 + 日活）';

const days = ref(7);
const loading = ref(false);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 获取图表配置 */
function buildOptions(
  dates: string[],
  series: Record<string, number[]>,
): EChartsOption {
  if (props.type === 'message') {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['私聊消息', '群聊消息'], top: 0 },
      grid: { left: 24, right: 24, bottom: 16, top: 42, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { formatter: (value: string) => value.slice(5, 10) },
      },
      yAxis: { type: 'value', name: '消息量' },
      series: [
        {
          name: '私聊消息',
          type: 'line',
          smooth: true,
          data: series.private || [],
          itemStyle: { color: '#2f7df6' },
          areaStyle: { color: 'rgba(47,125,246,0.12)' },
        },
        {
          name: '群聊消息',
          type: 'line',
          smooth: true,
          data: series.group || [],
          itemStyle: { color: '#18a058' },
          areaStyle: { color: 'rgba(24,160,88,0.12)' },
        },
      ],
    };
  }
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增注册', '日活'], top: 0 },
    grid: { left: 24, right: 32, bottom: 16, top: 42, containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { formatter: (value: string) => value.slice(5, 10) },
    },
    yAxis: [
      { type: 'value', name: '新增注册', position: 'left' },
      { type: 'value', name: '日活', position: 'right' },
    ],
    series: [
      {
        name: '新增注册',
        type: 'bar',
        yAxisIndex: 0,
        data: series.register || [],
        itemStyle: { color: '#f59e0b' },
        barMaxWidth: 24,
      },
      {
        name: '日活',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: series.active || [],
        itemStyle: { color: '#ef4444' },
      },
    ],
  };
}

/** 加载图表数据 */
async function loadData() {
  loading.value = true;
  try {
    const data =
      props.type === 'message'
        ? await getMessageTrend(days.value)
        : await getUserTrend(days.value);
    await nextTick();
    await renderEcharts(buildOptions(data.dates, data.series));
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <ElCard :body-style="{ padding: '12px 16px 16px' }">
    <template #header>
      <div class="flex items-center justify-between">
        <span>{{ title }}</span>
        <ElSelect
          v-model="days"
          class="w-28"
          size="small"
          @change="loadData"
        >
          <ElOption label="近 7 天" :value="7" />
          <ElOption label="近 15 天" :value="15" />
          <ElOption label="近 30 天" :value="30" />
        </ElSelect>
      </div>
    </template>
    <div class="relative min-h-[320px]">
      <EchartsUI ref="chartRef" height="320px" />
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-card/70 text-sm text-muted-foreground"
      >
        加载中
      </div>
    </div>
  </ElCard>
</template>
