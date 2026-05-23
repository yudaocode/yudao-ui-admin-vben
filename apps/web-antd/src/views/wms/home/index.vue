<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Button, Card } from 'ant-design-vue';

import { WmsWarehouseSelect } from '#/views/wms/md/warehouse/components';

import WmsHomeInventoryCharts from './modules/wms-home-inventory-charts.vue';
import WmsHomeOrderSummaryCards from './modules/wms-home-order-summary-cards.vue';
import WmsHomeOrderTrendChart from './modules/wms-home-order-trend-chart.vue';

defineOptions({ name: 'WmsHome' });

const loading = ref(false);
const warehouseId = ref<number>();
const statTime = ref(formatDateTime(new Date()));
const orderSummaryCardsRef =
  ref<InstanceType<typeof WmsHomeOrderSummaryCards>>();
const orderTrendChartRef = ref<InstanceType<typeof WmsHomeOrderTrendChart>>();
const inventoryChartsRef = ref<InstanceType<typeof WmsHomeInventoryCharts>>();

async function refresh() {
  loading.value = true;
  try {
    await Promise.all([
      orderSummaryCardsRef.value?.load(warehouseId.value),
      orderTrendChartRef.value?.load(warehouseId.value),
      inventoryChartsRef.value?.load(warehouseId.value),
    ]);
    statTime.value = formatDateTime(new Date());
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  refresh();
});
</script>

<template>
  <Page>
    <template #doc>
      <DocAlert
        title="WMS 手册（功能开启）"
        url="https://doc.iocoder.cn/wms/build/"
      />
    </template>
    <div class="flex flex-col gap-2">
      <Card :body-style="{ padding: '16px' }">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="text-xl font-semibold">WMS 首页</div>
            <div class="text-sm text-muted-foreground">
              单据工作台 / 库存概览
            </div>
          </div>
          <div class="flex items-center gap-2">
            <WmsWarehouseSelect
              v-model="warehouseId"
              class="!w-[220px]"
              placeholder="全部仓库"
              @change="refresh"
            />
            <Button :loading="loading" @click="refresh">刷新</Button>
          </div>
        </div>
      </Card>
      <WmsHomeOrderSummaryCards ref="orderSummaryCardsRef" />
      <WmsHomeOrderTrendChart ref="orderTrendChartRef" />
      <WmsHomeInventoryCharts ref="inventoryChartsRef" />
      <div class="text-center text-sm text-muted-foreground">
        统计时间：{{ statTime }}
      </div>
    </div>
  </Page>
</template>
