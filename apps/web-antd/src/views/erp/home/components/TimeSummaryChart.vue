<script lang="ts" setup>
import type { EChartsOption } from 'echarts';

import type { EchartsUIType } from '@vben/plugins/echarts';

import { ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Card } from 'ant-design-vue';

import { CardTitle } from '#/components/card';

interface Props {
  title: string;
  value?: Array<{ price: number; time: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 折线图配置 */
const lineChartOptions: EChartsOption = {
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
      name: '金额',
      type: 'line',
      smooth: true,
      areaStyle: {},
      data: [],
    },
  ],
  toolbox: {
    feature: {
      dataZoom: {
        yAxisIndex: false,
      },
      brush: {
        type: ['lineX', 'clear'],
      },
      saveAsImage: {
        show: true,
        name: props.title,
      },
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
    type: 'category',
    boundaryGap: false,
    axisTick: {
      show: false,
    },
    data: [],
  },
  yAxis: {
    axisTick: {
      show: false,
    },
  },
};

watch(
  () => props.value,
  (val) => {
    if (!val || val.length === 0) {
      return;
    }

    // 更新图表数据
    const xAxisData = val.map((item) => item.time);
    const seriesData = val.map((item) => item.price);

    const options = {
      ...lineChartOptions,
      xAxis: {
        ...lineChartOptions.xAxis,
        data: xAxisData,
      },
      series: [
        {
          ...lineChartOptions.series![0],
          data: seriesData,
        },
      ],
    };

    renderEcharts(options);
  },
  { immediate: true },
);
</script>

<template>
  <Card>
    <template #title>
      <CardTitle :title="title" />
    </template>
    <!-- 折线图 -->
    <EchartsUI ref="chartRef" />
  </Card>
</template>
