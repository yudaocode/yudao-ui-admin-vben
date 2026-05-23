<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { InventoryChartItem } from './wms-home-inventory-chart-options';

import { nextTick, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Card } from 'ant-design-vue';

import { getInventorySummary } from '#/api/wms/home';

import {
  buildInventoryChartItemList,
  formatQuantityText,
  getGoodsShareChartOptions,
  getWarehouseDistributionChartOptions,
} from './wms-home-inventory-chart-options';

defineOptions({ name: 'WmsHomeInventoryCharts' });

const GOODS_SHARE_LIMIT = 5;
const WAREHOUSE_DISTRIBUTION_LIMIT = 8;

const loading = ref(false);
const totalQuantity = ref(0);
const goodsShareList = ref<InventoryChartItem[]>([]);
const warehouseDistributionList = ref<InventoryChartItem[]>([]);
const goodsShareChartRef = ref<EchartsUIType>();
const warehouseDistributionChartRef = ref<EchartsUIType>();
const { renderEcharts: renderGoodsShareEcharts } =
  useEcharts(goodsShareChartRef);
const { renderEcharts: renderWarehouseDistributionEcharts } = useEcharts(
  warehouseDistributionChartRef,
);

/** 使用最新库存汇总数据渲染首页库存图表 */
async function renderCharts() {
  await nextTick();
  await Promise.all([
    renderGoodsShareEcharts(getGoodsShareChartOptions(goodsShareList.value)),
    renderWarehouseDistributionEcharts(
      getWarehouseDistributionChartOptions(warehouseDistributionList.value),
    ),
  ]);
}

/** 加载指定仓库的库存汇总和排行数据 */
async function load(warehouseId?: number) {
  loading.value = true;
  try {
    const data = await getInventorySummary({
      ...(warehouseId ? { warehouseId } : {}),
      goodsLimit: GOODS_SHARE_LIMIT,
      warehouseLimit: WAREHOUSE_DISTRIBUTION_LIMIT,
    });
    totalQuantity.value = Number(data.totalQuantity || 0);
    goodsShareList.value = buildInventoryChartItemList(
      data.goodsShareList,
      '未命名商品',
    );
    warehouseDistributionList.value = buildInventoryChartItemList(
      data.warehouseDistributionList,
      '未指定仓库',
    );
    await renderCharts();
  } finally {
    loading.value = false;
  }
}

defineExpose({ load });
</script>

<template>
  <div class="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
    <Card :body-style="{ padding: '12px 16px 16px' }">
      <div class="mb-3">
        <div class="font-semibold">货物占比</div>
        <div class="text-sm text-muted-foreground">
          按商品库存数量汇总 Top 5
        </div>
      </div>
      <div class="relative min-h-[300px]">
        <EchartsUI ref="goodsShareChartRef" height="300px" />
        <div
          v-if="loading"
          class="absolute inset-0 flex items-center justify-center bg-card/70 text-sm text-muted-foreground"
        >
          加载中
        </div>
      </div>
    </Card>
    <Card :body-style="{ padding: '12px 16px 16px' }">
      <div class="mb-3 flex justify-between">
        <div>
          <div class="font-semibold">库存分布</div>
          <div class="text-sm text-muted-foreground">按仓库库存数量汇总</div>
        </div>
        <span class="font-semibold">
          总库存 {{ formatQuantityText(totalQuantity) }}
        </span>
      </div>
      <div class="relative min-h-[300px]">
        <EchartsUI ref="warehouseDistributionChartRef" height="300px" />
        <div
          v-if="loading"
          class="absolute inset-0 flex items-center justify-center bg-card/70 text-sm text-muted-foreground"
        >
          加载中
        </div>
      </div>
    </Card>
  </div>
</template>
