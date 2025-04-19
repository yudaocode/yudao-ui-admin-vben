<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Demo03StudentApi } from '#/api/infra/demo/demo03/inner';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDemo03GradeByStudentId } from '#/api/infra/demo/demo03/inner';
import { nextTick, watch } from 'vue';

import { useDemo03GradeGridColumns } from '../data';

const props = defineProps<{
  studentId?: any; // 学生编号（主表的关联字段） // TODO @puhui999：上面的空行去掉
}>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useDemo03GradeGridColumns(),
    height: 'auto',
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<Demo03StudentApi.Demo03Student>,
});

/** 刷新表格 */
const onRefresh = async () => {
  await gridApi.grid.loadData([await getDemo03GradeByStudentId(props.studentId!)]);
};

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  async (val) => {
    if (!val) {
      return;
    }

    await nextTick(); // TODO @puhui999：上面的空行去掉
    await onRefresh();
  },
  { immediate: true },
);
</script>

<template>
  <div class="mx-4">
    <Grid table-title="学生班级列表" />
  </div>
</template>
