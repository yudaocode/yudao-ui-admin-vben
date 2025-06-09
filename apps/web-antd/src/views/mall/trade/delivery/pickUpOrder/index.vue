<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallOrderApi } from '#/api/mall/trade/order';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getOrderPage, getOrderSummary } from '#/api/mall/trade/order';
import { SummaryCard } from '#/components/summary-card';
import { DeliveryTypeEnum, fenToYuan } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';

const summary = ref<MallOrderApi.OrderSummary>();

async function getOrderSum() {
  const query = await gridApi.formApi.getValues();
  query.deliveryType = DeliveryTypeEnum.PICK_UP.type;
  const res = await getOrderSummary(query as any);
  summary.value = res;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getOrderPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            deliveryType: DeliveryTypeEnum.PICK_UP.type,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<MallOrderApi.Order>,
});

onMounted(() => {
  getOrderSum();
});
</script>

<template>
  <Page auto-content-height>
    <Card class="mb-4 h-[10%]">
      <template class="flex flex-row gap-4">
        <SummaryCard
          class="flex flex-1"
          title="订单数量"
          icon="icon-park-outline:transaction-order"
          icon-color="bg-blue-100"
          icon-bg-color="text-blue-500"
          :value="summary?.orderCount || 0"
        />
        <SummaryCard
          class="flex flex-1"
          title="订单金额"
          icon="streamline:money-cash-file-dollar-common-money-currency-cash-file"
          icon-color="bg-purple-100"
          icon-bg-color="text-purple-500"
          prefix="￥"
          :decimals="2"
          :value="Number(fenToYuan(summary?.orderPayPrice || 0))"
        />
        <SummaryCard
          class="flex flex-1"
          title="退款单数"
          icon="heroicons:receipt-refund"
          icon-color="bg-yellow-100"
          icon-bg-color="text-yellow-500"
          :value="summary?.afterSaleCount || 0"
        />
        <SummaryCard
          class="flex flex-1"
          title="退款金额"
          icon="ri:refund-2-line"
          icon-color="bg-green-100"
          icon-bg-color="text-green-500"
          prefix="￥"
          :decimals="2"
          :value="Number(fenToYuan(summary?.afterSalePrice || 0))"
        />
      </template>
    </Card>
    <Grid class="h-[80%]" table-title="核销订单" />
  </Page>
</template>
