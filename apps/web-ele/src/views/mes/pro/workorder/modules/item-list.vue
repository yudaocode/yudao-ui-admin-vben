<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProWorkOrderBomApi } from '#/api/mes/pro/workorder/bom';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWorkOrderBomItemListByWorkOrderId } from '#/api/mes/pro/workorder/bom';

import { useItemGridColumns } from '../data';

const props = defineProps<{
  workOrderId: number;
}>();

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useItemGridColumns(),
    height: 400,
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!props.workOrderId) {
            return [];
          }
          return await getWorkOrderBomItemListByWorkOrderId(props.workOrderId);
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
  } as VxeTableGridOptions<MesProWorkOrderBomApi.WorkOrderBom>,
});
</script>

<template>
  <Grid table-title="物料需求" />
</template>
