<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmProductSalesApi } from '#/api/mes/wm/productsales';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProductSalesPage } from '#/api/mes/wm/productsales';
import ProductSalesForm from '#/views/mes/wm/productsales/modules/form.vue';

const props = defineProps<{
  clientId: number;
}>();

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: ProductSalesForm,
  destroyOnClose: true,
});

/** 查看销售出库单详情 */
function handleViewSales(row: MesWmProductSalesApi.ProductSales) {
  if (row.id) {
    detailModalApi.setData({ formType: 'detail', id: row.id }).open();
  }
}

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'code',
        title: '出库单编号',
        minWidth: 160,
        slots: { default: 'code' },
      },
      {
        field: 'name',
        title: '出库单名称',
        minWidth: 150,
      },
      {
        field: 'salesOrderCode',
        title: '销售订单编号',
        minWidth: 140,
      },
      {
        field: 'salesDate',
        title: '出库日期',
        width: 180,
        formatter: 'formatDateTime',
      },
      {
        field: 'status',
        title: '单据状态',
        width: 120,
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS },
        },
      },
    ],
    height: 320,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getProductSalesPage({
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
  } as VxeTableGridOptions<MesWmProductSalesApi.ProductSales>,
});
</script>

<template>
  <DetailModal />
  <Grid table-title="销售记录">
    <template #code="{ row }">
      <Button type="link" @click="handleViewSales(row)">
        {{ row.code }}
      </Button>
    </template>
  </Grid>
</template>
