<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsInventoryHistoryApi } from '#/api/wms/inventory/history';

import { DocAlert, Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getInventoryHistoryPage } from '#/api/wms/inventory/history';
import { formatPrice, formatQuantity } from '#/views/wms/utils/format';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'WmsInventoryHistory' });

function hasValue(value: unknown) {
  return value !== undefined && value !== null;
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    showOverflow: false,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getInventoryHistoryPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<WmsInventoryHistoryApi.InventoryHistory>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【库存】库存记录、流水、统计"
        url="https://doc.iocoder.cn/wms/inventory/"
      />
    </template>

    <Grid table-title="库存流水">
      <template #itemInfo="{ row }">
        <div class="flex flex-col gap-1 py-1 leading-5">
          <div class="text-sm">{{ row.itemName || '-' }}</div>
          <div v-if="row.itemCode" class="break-all text-xs text-gray-500">
            商品编号：{{ row.itemCode }}
          </div>
        </div>
      </template>
      <template #skuInfo="{ row }">
        <div class="flex flex-col gap-1 py-1 leading-5">
          <div class="text-sm">{{ row.skuName || '-' }}</div>
          <div v-if="row.skuCode" class="break-all text-xs text-gray-500">
            规格编号：{{ row.skuCode }}
          </div>
        </div>
      </template>
      <template #beforeQuantity="{ row }">
        {{ formatQuantity(row.beforeQuantity) || '-' }}
      </template>
      <template #afterQuantity="{ row }">
        {{ formatQuantity(row.afterQuantity) || '-' }}
      </template>
      <template #quantityPrice="{ row }">
        <div class="flex flex-col gap-1 py-1 leading-5">
          <div class="flex justify-between gap-2">
            <span class="shrink-0">数量：</span>
            <span>{{ formatQuantity(row.quantity) }}</span>
          </div>
          <div v-if="hasValue(row.price)" class="flex justify-between gap-2">
            <span class="shrink-0">单价：</span>
            <span>{{ formatPrice(row.price) }}</span>
          </div>
          <div
            v-if="hasValue(row.totalPrice)"
            class="flex justify-between gap-2"
          >
            <span class="shrink-0">金额：</span>
            <span>{{ formatPrice(row.totalPrice) }}</span>
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
