<script lang="ts" setup>
import type { WmsHomeStatisticsApi } from '#/api/wms/home';

import { OrderStatusEnum, OrderTypeEnum, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { ElButton, ElCard, ElMessage, ElSkeleton } from 'element-plus';

import { getOrderSummary } from '#/api/wms/home';

defineOptions({ name: 'WmsHomeOrderSummaryCards' });

interface StatusItem {
  color: string;
  label: string;
  value: number;
}

interface OrderSummaryItem {
  color: string;
  routeName: string;
  statuses?: WmsHomeStatisticsApi.OrderStatus[];
  title: string;
  total?: number;
  type: number;
}

const router = useRouter();

const orderDefinitions: OrderSummaryItem[] = [
  {
    color: '#2f7df6',
    routeName: 'WmsReceiptOrder',
    title: getDictLabel(
      DICT_TYPE.WMS_ORDER_TYPE,
      OrderTypeEnum.RECEIPT,
    ).replace(/单$/, ''),
    type: OrderTypeEnum.RECEIPT,
  },
  {
    color: '#18a058',
    routeName: 'WmsShipmentOrder',
    title: getDictLabel(
      DICT_TYPE.WMS_ORDER_TYPE,
      OrderTypeEnum.SHIPMENT,
    ).replace(/单$/, ''),
    type: OrderTypeEnum.SHIPMENT,
  },
  {
    color: '#f59e0b',
    routeName: 'WmsMovementOrder',
    title: getDictLabel(
      DICT_TYPE.WMS_ORDER_TYPE,
      OrderTypeEnum.MOVEMENT,
    ).replace(/单$/, ''),
    type: OrderTypeEnum.MOVEMENT,
  },
  {
    color: '#7c3aed',
    routeName: 'WmsCheckOrder',
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.CHECK).replace(
      /单$/,
      '',
    ),
    type: OrderTypeEnum.CHECK,
  },
];

const statusList: StatusItem[] = [
  {
    color: '#409eff',
    label:
      getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, OrderStatusEnum.PREPARE) ||
      '草稿',
    value: OrderStatusEnum.PREPARE,
  },
  {
    color: '#67c23a',
    label:
      getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, OrderStatusEnum.FINISHED) ||
      '已完成',
    value: OrderStatusEnum.FINISHED,
  },
  {
    color: '#909399',
    label:
      getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, OrderStatusEnum.CANCELED) ||
      '已作废',
    value: OrderStatusEnum.CANCELED,
  },
];

const loading = ref(false);
const summaryList = ref<OrderSummaryItem[]>(orderDefinitions);

function getStatusCount(item: OrderSummaryItem, status: number) {
  return item.statuses?.find((row) => row.status === status)?.count ?? 0;
}

function getStatusPercent(item: OrderSummaryItem, status: number) {
  const total = item.total ?? 0;
  if (total <= 0) {
    return '0%';
  }
  return `${(getStatusCount(item, status) / total) * 100}%`;
}

async function handleNavigate(routeName: string) {
  try {
    await router.push({ name: routeName });
  } catch {
    ElMessage.warning('当前菜单尚未加载，请从左侧菜单进入对应页面');
  }
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
  <div class="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
    <ElCard
      v-for="item in summaryList"
      :key="item.type"
      :body-style="{ padding: '12px 16px 16px' }"
      class="h-full"
      shadow="never"
      :style="{ borderTop: `3px solid ${item.color}` }"
    >
      <ElSkeleton :loading="loading" animated :rows="4">
        <template #default>
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center gap-2 font-semibold">
              <span
                class="h-2 w-2 rounded-full"
                :style="{ backgroundColor: item.color }"
              ></span>
              {{ item.title }}
            </div>
            <ElButton
              link
              type="primary"
              @click="handleNavigate(item.routeName)"
            >
              查看
            </ElButton>
          </div>
          <div class="mb-1 flex items-baseline gap-2">
            <span class="text-muted-foreground">合计</span>
            <span class="text-3xl font-bold leading-9">
              {{ item.total?.toLocaleString() ?? 0 }}
            </span>
            <span class="text-muted-foreground">单</span>
          </div>
          <div class="my-3 flex h-2 overflow-hidden rounded-full bg-muted">
            <span
              v-for="status in statusList"
              :key="status.value"
              class="h-full"
              :style="{
                backgroundColor: status.color,
                width: getStatusPercent(item, status.value),
              }"
            ></span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div v-for="status in statusList" :key="status.value">
              <div class="truncate text-muted-foreground">
                {{ status.label }}
              </div>
              <div class="font-semibold" :style="{ color: status.color }">
                {{ getStatusCount(item, status.value).toLocaleString() }}
              </div>
            </div>
          </div>
        </template>
      </ElSkeleton>
    </ElCard>
  </div>
</template>
