<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { ElCard } from 'element-plus';

import { getWorkOrderStatusDistribution } from '#/api/mes/home';

import { getWorkOrderStatusChartOptions } from '../chart-options';
import { WORK_ORDER_STATUS_COLOR_MAP } from '../data';

defineOptions({ name: 'MesHomeWorkOrderChart' });

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 加载工单状态分布数据并渲染饼图 */
async function loadData() {
  const data = await getWorkOrderStatusDistribution();
  const chartData = data.map((d) => ({
    itemStyle: { color: WORK_ORDER_STATUS_COLOR_MAP[d.status] || '#409EFF' },
    name: d.statusName,
    value: d.count,
  }));
  await renderEcharts(getWorkOrderStatusChartOptions(chartData));
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <ElCard header="工单状态分布" class="h-full">
    <EchartsUI ref="chartRef" class="h-[280px] w-full" />
  </ElCard>
</template>
