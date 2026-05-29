<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmBatchApi } from '#/api/mes/wm/batch';

import { ref, watch } from 'vue';

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

const list = ref<MesWmBatchApi.Batch[]>([]); // 追溯结果列表

// TODO @AI：代码风格；
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useTraceGridColumns(),
    data: list.value,
    minHeight: 240,
    pagerConfig: { enabled: false },
    rowConfig: { isHover: true, keyField: 'id' },
    showOverflow: true,
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<MesWmBatchApi.Batch>,
});

/** 加载追溯列表 */
// TODO @AI：是不是可以在 useVbenVxeGrid 里面实现加载？
async function getList() {
  if (!props.batchCode) {
    list.value = [];
    gridApi.setGridOptions({ data: list.value });
    return;
  }
  gridApi.setLoading(true);
  try {
    list.value =
      props.direction === 'forward'
        ? await getForwardBatchList(props.batchCode)
        : await getBackwardBatchList(props.batchCode);
    gridApi.setGridOptions({ data: list.value });
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
