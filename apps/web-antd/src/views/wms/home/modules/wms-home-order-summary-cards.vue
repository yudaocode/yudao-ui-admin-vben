<script lang="ts" setup>
import type { WmsHomeStatisticsApi } from '#/api/wms/home';

import { ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { getOrderSummary } from '#/api/wms/home';
import { OrderStatusEnum, OrderTypeEnum } from '#/views/wms/utils/constants';

defineOptions({ name: 'WmsHomeOrderSummaryCards' });

interface OrderSummaryItem {
  color: string;
  statuses?: WmsHomeStatisticsApi.OrderStatus[];
  title: string;
  total?: number;
  type: number;
}

const orderDefinitions: OrderSummaryItem[] = [
  {
    color: '#2f7df6',
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.RECEIPT).replace(/单$/, ''),
    type: OrderTypeEnum.RECEIPT,
  },
  {
    color: '#18a058',
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.SHIPMENT).replace(/单$/, ''),
    type: OrderTypeEnum.SHIPMENT,
  },
  {
    color: '#f59e0b',
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.MOVEMENT).replace(/单$/, ''),
    type: OrderTypeEnum.MOVEMENT,
  },
  {
    color: '#7c3aed',
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.CHECK).replace(/单$/, ''),
    type: OrderTypeEnum.CHECK,
  },
];

const statusList = [
  { label: getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, OrderStatusEnum.PREPARE) || '草稿', value: OrderStatusEnum.PREPARE },
  { label: getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, OrderStatusEnum.FINISHED) || '已完成', value: OrderStatusEnum.FINISHED },
  { label: getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, OrderStatusEnum.CANCELED) || '已作废', value: OrderStatusEnum.CANCELED },
];

const loading = ref(false);
const summaryList = ref<OrderSummaryItem[]>(orderDefinitions);

function getStatusCount(item: OrderSummaryItem, status: number) {
  return item.statuses?.find((row) => row.status === status)?.count;
}

async function load(warehouseId?: number) {
  loading.value = true;
  try {
    const data = await getOrderSummary(warehouseId ? { warehouseId } : {});
    summaryList.value = orderDefinitions.map((definition) => {
      const summary = data.find((item) => item.type === definition.type);
      return {
        ...definition,
        statuses: summary?.statuses,
        total: summary?.total,
      };
    });
  } finally {
    loading.value = false;
  }
}

defineExpose({ load });
</script>

<template>
  <div class="mb-4 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
    <div
      v-for="item in summaryList"
      :key="item.type"
      class="rounded border bg-card p-4 shadow-sm"
      :style="{ borderTop: `3px solid ${item.color}` }"
    >
      <div class="mb-3 flex items-center justify-between">
        <span class="font-semibold">{{ item.title }}</span>
        <span v-if="loading" class="text-xs text-muted-foreground">加载中</span>
      </div>
      <div class="mb-3 text-3xl font-bold">{{ item.total }}</div>
      <div class="grid grid-cols-3 gap-2 text-sm">
        <div v-for="status in statusList" :key="status.value">
          <div class="truncate text-muted-foreground">{{ status.label }}</div>
          <div class="font-semibold">{{ getStatusCount(item, status.value) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
