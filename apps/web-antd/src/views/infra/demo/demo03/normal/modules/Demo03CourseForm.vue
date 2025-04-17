<script lang="ts" setup>
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { Demo03StudentApi } from '#/api/infra/demo/demo03/normal';

import { Plus } from '@vben/icons';
import { Button, Input } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDemo03CourseListByStudentId } from '#/api/infra/demo/demo03/normal';
import { $t } from '#/locales';
import { h, nextTick, watch } from 'vue';

import { useDemo03CourseGridColumns } from '../data';

const props = defineProps<{
  studentId?: any; // 学生编号（主表的关联字段）
}>();

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<Demo03StudentApi.Demo03Course>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
  }
}

const [Demo03CourseGrid, demo03CourseGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useDemo03CourseGridColumns(onActionClick),
    border: true,
    showOverflow: true,
    autoResize: true,
    keepSource: true,
    rowConfig: {
      keyField: 'id',
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

/** 删除学生课程 */
const onDelete = async (row: Demo03StudentApi.Demo03Course) => {
  await demo03CourseGridApi.grid.remove(row);
};

/** 添加学生课程 */
const handleAdd = async () => {
  await demo03CourseGridApi.grid.insertAt({} as Demo03StudentApi.Demo03Course, -1);
};

/** 提供获取表格数据的方法供父组件调用 */
defineExpose({
  getData: (): Demo03StudentApi.Demo03Course[] => {
    return [
      ...demo03CourseGridApi.grid.getData(),
      ...demo03CourseGridApi.grid.getInsertRecords().map((row) => {
        delete row.id;
        return row;
      }),
    ];
  },
});

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  async (val) => {
    if (!val) {
      return;
    }

    await nextTick();
    await demo03CourseGridApi.grid.loadData(await getDemo03CourseListByStudentId(props.studentId!));
  },
  { immediate: true },
);
</script>

<template>
  <Demo03CourseGrid class="mx-4">
    <template #name="{ row }">
      <Input v-model:value="row.name" />
    </template>
    <template #score="{ row }">
      <Input v-model:value="row.score" />
    </template>
  </Demo03CourseGrid>
  <div class="flex justify-center">
    <Button :icon="h(Plus)" type="primary" ghost @click="handleAdd" v-access:code="['infra:demo03-student:create']">
      {{ $t('ui.actionTitle.create', ['学生课程']) }}
    </Button>
  </div>
</template>
