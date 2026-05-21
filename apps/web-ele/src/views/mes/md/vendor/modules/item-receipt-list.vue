<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmItemReceiptLineApi } from '#/api/mes/wm/itemreceipt/line';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getItemReceiptLinePage } from '#/api/mes/wm/itemreceipt/line';

const props = defineProps<{
  vendorId: number;
}>();

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'receiptCode', title: '入库单编号', minWidth: 160 },
      { field: 'purchaseOrderCode', title: '采购订单号', minWidth: 150 },
      { field: 'itemCode', title: '物料编码', width: 140 },
      { field: 'itemName', title: '物料名称', minWidth: 150 },
      { field: 'specification', title: '规格型号', minWidth: 140 },
      { field: 'unitMeasureName', title: '单位', width: 100 },
      { field: 'receivedQuantity', title: '入库数量', width: 120 },
    ],
    height: 320,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getItemReceiptLinePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            vendorId: props.vendorId,
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
    },
  } as VxeTableGridOptions<MesWmItemReceiptLineApi.ItemReceiptLine>,
});
</script>

<template>
  <Grid table-title="采购记录" />
</template>
