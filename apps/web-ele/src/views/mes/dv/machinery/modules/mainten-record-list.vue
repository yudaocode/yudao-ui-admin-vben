<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvMaintenRecordApi } from '#/api/mes/dv/maintenrecord';

import { watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMaintenRecordPage } from '#/api/mes/dv/maintenrecord';

const props = defineProps<{ machineryId: number }>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'planName', title: '计划名称', minWidth: 150 },
      {
        field: 'planCycleType',
        title: '周期类型',
        width: 120,
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MES_DV_CYCLE_TYPE },
        },
      },
      { field: 'maintenTime', title: '保养时间', width: 180, formatter: 'formatDateTime' },
      { field: 'nickname', title: '操作人', minWidth: 120 },
      {
        field: 'status',
        title: '状态',
        width: 120,
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MES_MAINTEN_RECORD_STATUS },
        },
      },
    ],
    height: 320,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) =>
          await getMaintenRecordPage({
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
  } as VxeTableGridOptions<MesDvMaintenRecordApi.MaintenRecord>,
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
  <Grid table-title="保养记录" />
</template>
