<script lang="ts" setup>
import type { VxeTableInstance } from '#/adapter/vxe-table';
import type { Demo03StudentApi } from '#/api/infra/demo/demo03/inner';

import { h, ref, watch } from 'vue';

import { Plus } from '@vben/icons';

import { ElButton, ElInput, ElMessage } from 'element-plus';

import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import { getDemo03CourseListByStudentId } from '#/api/infra/demo/demo03/inner';
import { $t } from '#/locales';

const props = defineProps<{
  studentId?: number; // 学生编号（主表的关联字段）
}>();

const list = ref<Demo03StudentApi.Demo03Course[]>([]); // 列表的数据
const tableRef = ref<VxeTableInstance>();
/** 添加学生课程 */
const onAdd = async () => {
  await tableRef.value?.insertAt({} as Demo03StudentApi.Demo03Course, -1);
};

/** 删除学生课程 */
const onDelete = async (row: Demo03StudentApi.Demo03Course) => {
  await tableRef.value?.remove(row);
};

/** 获取当前课程，新增课程不提交表格生成的临时编号 */
function getData(): Demo03StudentApi.Demo03Course[] {
  const table = tableRef.value;
  if (!table) {
    return [];
  }
  const { fullData } = table.getTableData();
  const inserted = new Set(table.getInsertRecords());
  return fullData.map((row) =>
    inserted.has(row) ? { ...row, id: undefined } : { ...row },
  );
}

/** 校验课程子表 */
function validate(): boolean {
  for (const [index, row] of getData().entries()) {
    if (
      !row.name?.trim() ||
      row.score === null ||
      row.score === undefined ||
      String(row.score).trim() === ''
    ) {
      ElMessage.error(`第 ${index + 1} 行：课程名称和分数不能为空`);
      return false;
    }
  }
  return true;
}

defineExpose({ getData, validate });

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  async (val) => {
    list.value = [];
    if (!val) {
      return;
    }
    list.value = await getDemo03CourseListByStudentId(props.studentId!);
  },
  { immediate: true },
);
</script>

<template>
  <VxeTable ref="tableRef" :data="list" show-overflow class="mx-4">
    <VxeColumn field="name" title="名字" align="center">
      <template #default="{ row }">
        <ElInput v-model="row.name" />
      </template>
    </VxeColumn>
    <VxeColumn field="score" title="分数" align="center">
      <template #default="{ row }">
        <ElInput v-model="row.score" />
      </template>
    </VxeColumn>
    <VxeColumn field="operation" title="操作" align="center">
      <template #default="{ row }">
        <ElButton
          size="small"
          type="danger"
          link
          @click="onDelete(row)"
          v-access:code="['infra:demo03-student:delete']"
        >
          {{ $t('ui.actionTitle.delete') }}
        </ElButton>
      </template>
    </VxeColumn>
  </VxeTable>
  <div class="mt-4 flex justify-center">
    <ElButton
      :icon="h(Plus)"
      type="primary"
      plain
      @click="onAdd"
      v-access:code="['infra:demo03-student:create']"
    >
      {{ $t('ui.actionTitle.create', ['学生课程']) }}
    </ElButton>
  </div>
</template>
