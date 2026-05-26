<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmItemConsumeLineApi } from '#/api/mes/wm/itemconsume/line';

import { watch } from 'vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getItemConsumeLinePage } from '#/api/mes/wm/itemconsume/line';

const props = defineProps<{
  feedbackId: number;
}>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'itemCode', title: '物资编码', minWidth: 120 },
      { field: 'itemName', title: '物资名称', minWidth: 140 },
      { field: 'specification', title: '规格型号', minWidth: 120 },
      { field: 'quantity', title: '消耗数量', minWidth: 100 },
      { field: 'unitName', title: '单位', minWidth: 80 },
      { field: 'batchCode', title: '批次号', minWidth: 120 },
    ],
    height: 320,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.feedbackId) {
            return { list: [], total: 0 };
          }
          return await getItemConsumeLinePage({
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
      refresh: false,
      search: false,
    },
  } as VxeTableGridOptions<MesWmItemConsumeLineApi.ItemConsumeLine>,
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
