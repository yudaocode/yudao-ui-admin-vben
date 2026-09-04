<script lang="ts" setup>
import type { HrmHomeApi } from '#/api/hrm/home';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Empty } from 'antdv-next';

import { getTeamSurveyPieChartOptions } from '../../chart-options';

defineOptions({ name: 'HrmTeamSurveyChart' });

const props = defineProps<{
  data: HrmHomeApi.TeamHomeAnalysisItem[];
  formatType: (type: null | number) => string;
  title: string;
}>();

const chartRef = ref();
const { renderEcharts } = useEcharts(chartRef);

const hasData = computed(() => props.data.some((item) => item.count > 0));

/** 渲染饼图 */
async function renderChart() {
  if (!hasData.value) {
    return;
  }
  await nextTick();
  const chartData = props.data
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: props.formatType(item.type),
      value: item.count,
    }));
  await renderEcharts(getTeamSurveyPieChartOptions(chartData));
}

watch(
  () => props.data,
  () => {
    renderChart();
  },
  { deep: true },
);

/** 初始化 */
onMounted(() => {
  renderChart();
});
</script>

<template>
  <div class="min-h-[260px]">
    <div class="mb-1 text-center text-sm">
      {{ title }}
    </div>
    <EchartsUI v-if="hasData" ref="chartRef" class="h-[230px] w-full" />
    <Empty
      v-else
      class="py-8"
      :image-style="{ height: '64px' }"
      description="暂无数据"
    />
  </div>
</template>
