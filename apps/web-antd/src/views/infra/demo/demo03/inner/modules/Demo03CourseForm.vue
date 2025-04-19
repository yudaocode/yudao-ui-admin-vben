<script lang="ts" setup>
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { Demo03StudentApi } from '#/api/infra/demo/demo03/inner';

import { Plus } from '@vben/icons';
import { Button, Input } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDemo03CourseListByStudentId } from '#/api/infra/demo/demo03/inner';
import { $t } from '#/locales';
import { h, nextTick, watch } from 'vue';

import { useDemo03CourseGridEditColumns } from '../data';

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
    columns: useDemo03CourseGridEditColumns(onActionClick),
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
    // 获取当前数据，但排除已删除的记录
    const allData = demo03CourseGridApi.grid.getData();
    const removedData = demo03CourseGridApi.grid.getRemoveRecords();
    const removedIds = new Set(removedData.map((row) => row.id));

    // 过滤掉已删除的记录
    const currentData = allData.filter((row) => !removedIds.has(row.id));

    // 获取新插入的记录并移除id
    const insertedData = demo03CourseGridApi.grid.getInsertRecords().map((row) => {
      delete row.id;
      return row;
    });

    return [...currentData, ...insertedData];
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
