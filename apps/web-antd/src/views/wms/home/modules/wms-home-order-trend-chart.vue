<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { WmsHomeStatisticsApi } from '#/api/wms/home';

import { nextTick, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Card, Segmented } from 'ant-design-vue';

import { getOrderTrend } from '#/api/wms/home';

import { getOrderTrendChartOptions } from './wms-home-order-trend-chart-options';

defineOptions({ name: 'WmsHomeOrderTrendChart' });

const loading = ref(false);
const warehouseId = ref<number>();
const trendDays = ref(7);
const trendList = ref<WmsHomeStatisticsApi.OrderTrend[]>([]);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const trendDayOptions = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 },
];

/** 使用最新趋势数据渲染单据趋势图 */
async function renderChart() {
  await nextTick();
  await renderEcharts(getOrderTrendChartOptions(trendList.value));
}

/** 加载指定仓库的单据趋势数据 */
async function load(selectedWarehouseId?: number) {
  warehouseId.value = selectedWarehouseId;
  loading.value = true;
  try {
    trendList.value = await getOrderTrend(
      trendDays.value,
      selectedWarehouseId ? { warehouseId: selectedWarehouseId } : {},
    );
    await renderChart();
  } finally {
    loading.value = false;
  }
}

/** 切换趋势统计时间范围并刷新图表 */
async function handleTrendDaysChange(value: number | string) {
  trendDays.value = Number(value);
  await load(warehouseId.value);
}

defineExpose({ load });
</script>

<template>
  <Card :body-style="{ padding: '12px 16px 16px' }">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <div class="font-semibold">单据趋势</div>
        <div class="text-sm text-muted-foreground">
          入库、出库、移库、盘库单据数量
        </div>
      </div>
      <Segmented
        :options="trendDayOptions"
        :value="trendDays"
        @change="handleTrendDaysChange"
      />
    </div>
    <div class="relative min-h-[330px]">
      <EchartsUI ref="chartRef" height="330px" />
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-card/70 text-sm text-muted-foreground"
      >
        加载中
      </div>
    </div>
  </Card>
</template>
