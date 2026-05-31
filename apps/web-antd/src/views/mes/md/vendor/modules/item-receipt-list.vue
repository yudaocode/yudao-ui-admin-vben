<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmItemReceiptLineApi } from '#/api/mes/wm/itemreceipt/line';

import { useVbenModal } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getItemReceiptLinePage } from '#/api/mes/wm/itemreceipt/line';

import ItemReceiptDetail from './item-receipt-detail.vue';

const props = defineProps<{
  vendorId: number;
}>();

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: ItemReceiptDetail,
  destroyOnClose: true,
});

/** 查看采购入库单详情 */
function handleViewReceipt(row: MesWmItemReceiptLineApi.ItemReceiptLine) {
  if (row.receiptId) {
    detailModalApi.setData({ id: row.receiptId }).open();
  }
}

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'receiptCode',
        title: '入库单编号',
        minWidth: 160,
        slots: { default: 'receiptCode' },
      },
      {
        field: 'purchaseOrderCode',
        title: '采购订单号',
        minWidth: 150,
      },
      {
        field: 'itemCode',
        title: '物料编码',
        width: 140,
      },
      {
        field: 'itemName',
        title: '物料名称',
        minWidth: 150,
      },
      {
        field: 'specification',
        title: '规格型号',
        minWidth: 140,
      },
      {
        field: 'unitMeasureName',
        title: '单位',
        width: 100,
      },
      {
        field: 'receivedQuantity',
        title: '入库数量',
        width: 120,
      },
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
  <DetailModal />
  <Grid table-title="采购记录">
    <template #receiptCode="{ row }">
      <Button type="link" @click="handleViewReceipt(row)">
        {{ row.receiptCode }}
      </Button>
    </template>
  </Grid>
</template>
