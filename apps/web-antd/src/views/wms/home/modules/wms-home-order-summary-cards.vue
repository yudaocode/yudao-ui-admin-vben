<script lang="ts" setup>
import { ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { getOrderSummary } from '#/api/wms/home';
import { OrderStatusEnum } from '#/views/wms/utils/constants';

defineOptions({ name: 'WmsHomeOrderSummaryCards' });

const orderDefinitions = [
  { color: '#2f7df6', title: '入库', type: 1 },
  { color: '#18a058', title: '出库', type: 2 },
  { color: '#f59e0b', title: '移库', type: 3 },
  { color: '#7c3aed', title: '盘库', type: 4 },
];

const statusList = [
  { label: getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, OrderStatusEnum.PREPARE) || '草稿', value: OrderStatusEnum.PREPARE },
  { label: getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, OrderStatusEnum.FINISHED) || '已完成', value: OrderStatusEnum.FINISHED },
  { label: getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, OrderStatusEnum.CANCELED) || '已作废', value: OrderStatusEnum.CANCELED },
];

const loading = ref(false);
const summaryList = ref<any[]>(
  orderDefinitions.map((item) => ({ ...item, statuses: [], total: 0 })),
);

function getStatusCount(item: any, status: number) {
  return item.statuses?.find((row: any) => row.status === status)?.count || 0;
}

async function load(warehouseId?: number) {
  loading.value = true;
  try {
    const data = await getOrderSummary(warehouseId ? { warehouseId } : {});
    summaryList.value = orderDefinitions.map((definition) => {
      const summary = data.find((item) => item.type === definition.type);
      return {
        ...definition,
        title:
          getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, definition.type)?.replace(/单$/, '') ||
          definition.title,
        statuses: summary?.statuses || [],
        total: summary?.total || 0,
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
