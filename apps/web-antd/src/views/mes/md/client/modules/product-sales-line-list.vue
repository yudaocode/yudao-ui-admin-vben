<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmProductSalesLineApi } from '#/api/mes/wm/productsales/line';

import { useVbenModal } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProductSalesLinePage } from '#/api/mes/wm/productsales/line';
import ItemForm from '#/views/mes/md/item/modules/form.vue';

const props = defineProps<{
  clientId: number;
}>();

const [ItemFormModal, itemFormModalApi] = useVbenModal({
  connectedComponent: ItemForm,
  destroyOnClose: true,
});

/** 查看物料详情 */
function handleViewItem(row: MesWmProductSalesLineApi.ProductSalesLine) {
  itemFormModalApi.setData({ id: row.itemId, formType: 'detail' }).open();
}

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'itemCode',
        title: '物料编码',
        width: 140,
        slots: { default: 'itemCode' },
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
        field: 'quantity',
        title: '出库数量',
        width: 120,
      },
      {
        field: 'batchCode',
        title: '批次号',
        minWidth: 140,
      },
    ],
    height: 320,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getProductSalesLinePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            clientId: props.clientId,
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
  } as VxeTableGridOptions<MesWmProductSalesLineApi.ProductSalesLine>,
});
</script>

<template>
  <ItemFormModal />
  <Grid table-title="产品清单">
    <template #itemCode="{ row }">
      <Button type="link" @click="handleViewItem(row)">
        {{ row.itemCode }}
      </Button>
    </template>
  </Grid>
</template>
