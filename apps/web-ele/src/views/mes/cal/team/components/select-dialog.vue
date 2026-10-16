<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesCalTeamApi } from '#/api/mes/cal/team';

import { nextTick, ref } from 'vue';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTeamPage } from '#/api/mes/cal/team';

import { useTeamSelectGridColumns, useTeamSelectGridFormSchema } from '../data';

const emit = defineEmits<{ selected: [rows: MesCalTeamApi.Team[]] }>();
const open = ref(false); // 弹窗是否打开
const multiple = ref(true); // 是否多选
const selectedRows = ref<MesCalTeamApi.Team[]>([]); // 已选班组列表
const preSelectedIds = ref<number[]>([]); // 预选班组编号列表

function getSelectedRows(): MesCalTeamApi.Team[] {
  return [
    ...gridApi.grid.getCheckboxReserveRecords(),
    ...gridApi.grid.getCheckboxRecords(),
  ];
}

/** 处理勾选变化 */
function handleCheckboxChange() {
  selectedRows.value = getSelectedRows();
}

/** 处理全选变化 */
function handleCheckboxAll() {
  selectedRows.value = getSelectedRows();
}

/** 双击行：多选切换勾选，单选直接确认 */
function handleCellDblclick({ row }: { row: MesCalTeamApi.Team }) {
  if (multiple.value) {
    const records = gridApi.grid.getCheckboxRecords() as MesCalTeamApi.Team[];
    const checked = records.some((item) => item.id === row.id);
    gridApi.grid.setCheckboxRow(row, !checked);
    selectedRows.value = getSelectedRows();
    return;
  }
  selectedRows.value = [row];
  handleConfirm();
}

/** 回显预选班组 */
function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesCalTeamApi.Team[];
  for (const row of rows) {
    if (row.id && preSelectedIds.value.includes(row.id)) {
      gridApi.grid.setCheckboxRow(row, true);
    }
  }
  selectedRows.value = getSelectedRows();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useTeamSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useTeamSelectGridColumns(),
    height: 520,
    keepSource: true,
    checkboxConfig: {
      highlight: true,
      range: true,
      reserve: true,
    },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async ({ page }, formValues) =>
          await getTeamPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MesCalTeamApi.Team>,
  gridEvents: {
    checkboxAll: handleCheckboxAll,
    checkboxChange: handleCheckboxChange,
    cellDblclick: handleCellDblclick,
  },
});

/** 重置查询和选择状态 */
async function resetQueryState(resetForm = true) {
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  if (resetForm) {
    await gridApi.formApi.reset();
  }
}

/** 打开班组选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  await resetQueryState();
  await nextTick();
  const formValues = await gridApi.formApi.getValues();
  gridApi.formApi.setLatestSubmissionValues(formValues);
  await gridApi.reload(formValues);
  await nextTick();
  applyPreSelection();
}

/** 关闭班组选择弹窗 */
async function closeModal() {
  await resetQueryState(false);
  open.value = false;
}

/** 确认选择班组 */
function handleConfirm() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
    return;
  }
  emit(
    'selected',
    multiple.value ? selectedRows.value : [selectedRows.value[0]!],
  );
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <ElDialog
    v-model="open"
    title="班组选择"
    width="720px"
    :append-to-body="true"
    destroy-on-close
    @close="closeModal"
  >
    <Grid table-title="班组列表" />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
