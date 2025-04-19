<script lang="ts" setup>
// TODO @puhui999：命名使用小写 + 中划线
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
  studentId?: any; // 学生编号（主表的关联字段） TODO @puhui999：类型定义，应该是 number？
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

// TODO @puhui999：对于当前来说，就 Grid，gridApi，更简洁一点？
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
// TODO @puhui999：要不改成 onAdd？风格一致？；然后 add 放 delete 前面；
const handleAdd = async () => {
  await demo03CourseGridApi.grid.insertAt({} as Demo03StudentApi.Demo03Course, -1);
};

/** 提供获取表格数据的方法供父组件调用 */
defineExpose({
  getData: (): Demo03StudentApi.Demo03Course[] => {
    // TODO @puhui999 ： 要不简化成这样哈？
    const data = demo03CourseGridApi.grid.getData() as Demo03StudentApi.Demo03Course[];
    const removeRecords = demo03CourseGridApi.grid.getRemoveRecords() as Demo03StudentApi.Demo03Course[];
    const insertRecords = demo03CourseGridApi.grid.getInsertRecords() as Demo03StudentApi.Demo03Course[];
    return data
      .filter(row => !removeRecords.some(removed => removed.id === row.id))
      .concat(insertRecords.map(row => ({ ...row, id: undefined })));
  },
});

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  async (val) => {
    if (!val) {
      return;
    }

    await nextTick(); // TODO @puhui999：上面的空行去掉
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
  <!-- TODO @puhui999：-mt-4 把距离控制下哈； -->
  <div class="flex justify-center -mt-4">
    <Button :icon="h(Plus)" type="primary" ghost @click="handleAdd" v-access:code="['infra:demo03-student:create']">
      {{ $t('ui.actionTitle.create', ['学生课程']) }}
    </Button>
  </div>
</template>
