<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpSaleOrderApi } from '#/api/erp/sale/order';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSaleOrderPage } from '#/api/erp/sale/order';

import { useOrderGridColumns, useOrderGridFormSchema } from '../data';

const emit = defineEmits(['selectRow']);
const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useOrderGridFormSchema(),
  },
  gridOptions: {
    columns: useOrderGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSaleOrderPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            outEnable: true,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    radioConfig: {
      trigger: 'row',
      highlight: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<ErpSaleOrderApi.SaleOrder>,
  gridEvents: {
    radioChange: ({ row }: { row: ErpSaleOrderApi.SaleOrder }) => {
      emit('selectRow', row);
    },
  },
});
</script>

<template>
  <Grid class="max-h-[600px]" table-title="销售订单列表(仅展示可出库)" />
</template>
