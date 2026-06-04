<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Card, RadioButton, RadioGroup } from 'ant-design-vue';

import { getProductionTrend } from '#/api/mes/home';

import { getProductionTrendChartOptions } from '../chart-options';

defineOptions({ name: 'MesHomeProductionTrend' });

const trendDays = ref(7); // 当前选中的天数范围
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 加载生产趋势数据并渲染图表 */
async function loadData() {
  const data = await getProductionTrend(trendDays.value);
  const dates = data.map((d) => d.date.slice(5));
  const quantities = data.map((d) => d.quantity);
  const qualified = data.map((d) => d.qualifiedQuantity);
  const unqualified = data.map((d) => d.unqualifiedQuantity);
  await renderEcharts(
    getProductionTrendChartOptions(dates, quantities, qualified, unqualified),
  );
}

/** 切换天数范围 */
function handleDaysChange() {
  loadData();
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <Card title="生产趋势" class="h-full">
    <template #extra>
      <RadioGroup
        v-model:value="trendDays"
        size="small"
        @change="handleDaysChange"
      >
        <RadioButton :value="7">近 7 天</RadioButton>
        <RadioButton :value="30">近 30 天</RadioButton>
      </RadioGroup>
    </template>
    <EchartsUI ref="chartRef" class="h-[320px] w-full" />
  </Card>
</template>
