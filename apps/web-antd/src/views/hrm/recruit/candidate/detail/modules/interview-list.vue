<script lang="ts" setup>
import type { HrmRecruitInterviewApi } from '#/api/hrm/recruit/interview';

import { nextTick, onMounted, watch } from 'vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { useInterviewColumns } from '../data';

const props = defineProps<{
  interviewList: HrmRecruitInterviewApi.RecruitInterview[];
}>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useInterviewColumns(),
    data: [],
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

/** 刷新表格数据 */
async function refreshData() {
  await nextTick();
  gridApi.grid?.reloadData(props.interviewList || []);
}

watch(
  () => props.interviewList,
  () => {
    refreshData();
  },
  { deep: true },
);

onMounted(() => {
  refreshData();
});
</script>

<template>
  <Grid />
</template>
