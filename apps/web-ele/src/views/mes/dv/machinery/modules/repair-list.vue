<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvRepairApi } from '#/api/mes/dv/repair';

import { watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getRepairPage } from '#/api/mes/dv/repair';

const props = defineProps<{ machineryId: number }>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'code', title: '维修单号', minWidth: 140 },
      { field: 'name', title: '维修单名称', minWidth: 150 },
      {
        field: 'result',
        title: '维修结果',
        width: 120,
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MES_DV_REPAIR_RESULT },
        },
      },
      { field: 'requireDate', title: '报修日期', width: 180, formatter: 'formatDateTime' },
      { field: 'nickname', title: '操作人', minWidth: 120 },
      {
        field: 'status',
        title: '状态',
        width: 120,
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MES_DV_REPAIR_STATUS },
        },
      },
    ],
    height: 320,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) =>
          await getRepairPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            machineryId: props.machineryId,
          }),
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<MesDvRepairApi.Repair>,
});

watch(
  () => props.machineryId,
  (value) => {
    if (value) {
      gridApi.query();
    }
  },
);
</script>

<template>
  <Grid table-title="维修记录" />
</template>
