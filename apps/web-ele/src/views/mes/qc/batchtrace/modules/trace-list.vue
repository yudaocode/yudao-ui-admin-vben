<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmBatchApi } from '#/api/mes/wm/batch';

import { watch } from 'vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getBackwardBatchList,
  getForwardBatchList,
} from '#/api/mes/wm/batch';

import { useTraceGridColumns } from '../data';

const props = defineProps<{
  batchCode?: string;
  direction: 'backward' | 'forward'; // 追溯方向：forward=向前，backward=向后
}>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useTraceGridColumns(),
    minHeight: 240,
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    showOverflow: true,
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MesWmBatchApi.Batch>,
});

/** 加载追溯列表 */
async function getList() {
  if (!props.batchCode) {
    await gridApi.grid?.loadData([]);
    return;
  }
  gridApi.setLoading(true);
  try {
    const list =
      props.direction === 'forward'
        ? await getForwardBatchList(props.batchCode)
        : await getBackwardBatchList(props.batchCode);
    await gridApi.grid?.loadData(list);
  } finally {
    gridApi.setLoading(false);
  }
}

watch(
  () => props.batchCode,
  () => {
    getList();
  },
  { immediate: true },
);
</script>

<template>
  <Grid class="w-full" />
</template>
