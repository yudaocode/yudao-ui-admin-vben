<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmProductProduceLineApi } from '#/api/mes/wm/productproduce/line';

import { watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProductProduceLinePage } from '#/api/mes/wm/productproduce/line';

const props = defineProps<{
  feedbackId: number;
}>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'itemCode', title: '物资编码', minWidth: 120 },
      { field: 'itemName', title: '物资名称', minWidth: 140 },
      { field: 'specification', title: '规格型号', minWidth: 120 },
      { field: 'quantity', title: '产出数量', minWidth: 100 },
      { field: 'unitMeasureName', title: '单位', minWidth: 80 },
      { field: 'batchCode', title: '批次号', minWidth: 120 },
      {
        field: 'qualityStatus',
        title: '质量状态',
        minWidth: 100,
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MES_WM_QUALITY_STATUS },
        },
      },
    ],
    height: 320,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getProductProduceLinePage({
            feedbackId: props.feedbackId,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
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
  } as VxeTableGridOptions<MesWmProductProduceLineApi.ProductProduceLine>,
});

watch(
  () => props.feedbackId,
  () => {
    gridApi.query();
  },
);
</script>

<template>
  <Grid />
</template>
