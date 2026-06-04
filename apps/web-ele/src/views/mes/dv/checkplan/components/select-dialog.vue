<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvCheckPlanApi } from '#/api/mes/dv/checkplan';

import { nextTick, ref } from 'vue';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCheckPlanPage } from '#/api/mes/dv/checkplan';

import {
  useCheckPlanSelectGridColumns,
  useCheckPlanSelectGridFormSchema,
} from '../data';

defineOptions({ name: 'DvCheckPlanSelectDialog' });

const emit = defineEmits<{
  selected: [rows: MesDvCheckPlanApi.CheckPlan[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选
const fixedType = ref<number>(); // 固定计划类型筛选
const fixedStatus = ref<number>(); // 固定状态筛选
const selectedRows = ref<MesDvCheckPlanApi.CheckPlan[]>([]); // 已选方案列表
const preSelectedIds = ref<number[]>([]); // 预选方案编号列表

/** 获取当前表格数据 */
function getTableRows() {
  return gridApi.grid.getTableData().fullData as MesDvCheckPlanApi.CheckPlan[];
}

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesDvCheckPlanApi.CheckPlan>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesDvCheckPlanApi.CheckPlan[];
  records.forEach((row) => {
    const rowId = row.id;
    if (rowId != null) {
      selectedMap.set(rowId, row);
    }
  });
  return [...selectedMap.values()];
}

/** 处理勾选变化 */
function handleCheckboxSelectChange() {
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理单选变化 */
function handleRadioChange(row: MesDvCheckPlanApi.CheckPlan) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesDvCheckPlanApi.CheckPlan) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击 */
async function handleCellDblclick({ row }: { row: MesDvCheckPlanApi.CheckPlan }) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选方案 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = getTableRows();
  for (const row of rows) {
    if (row.id == null || !preSelectedIds.value.includes(row.id)) {
      continue;
    }
    if (multiple.value) {
      await gridApi.grid.setCheckboxRow(row, true);
    } else {
      await gridApi.grid.setRadioRow(row);
      selectedRows.value = [row];
      return;
    }
  }
  if (multiple.value) {
    selectedRows.value = getMultipleSelectedRows();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useCheckPlanSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useCheckPlanSelectGridColumns(false),
    height: 520,
    keepSource: true,
    checkboxConfig: {
      highlight: true,
      range: true,
      reserve: true,
    },
    radioConfig: {
      highlight: true,
      trigger: 'row',
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getCheckPlanPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            status: fixedStatus.value,
            type: fixedType.value,
          });
        },
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
  } as VxeTableGridOptions<MesDvCheckPlanApi.CheckPlan>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesDvCheckPlanApi.CheckPlan }) => {
      handleRadioChange(row);
    },
  },
});

/** 重置查询和选择状态 */
async function resetQueryState() {
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.resetForm();
}

/** 打开方案选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean; status?: number; type?: number },
) {
  open.value = true;
  multiple.value = options?.multiple ?? false;
  fixedType.value = options?.type;
  fixedStatus.value = options?.status;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  gridApi.setGridOptions({
    columns: useCheckPlanSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭方案选择弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择方案 */
function handleConfirm() {
  const rows = multiple.value ? getMultipleSelectedRows() : selectedRows.value;
  if (rows.length === 0) {
    ElMessage.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
    return;
  }
  emit('selected', multiple.value ? rows : [rows[0]!]);
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <ElDialog
    v-model="open"
    title="点检方案选择"
    width="70%"
    destroy-on-close
    @close="closeModal"
  >
    <Grid table-title="点检方案列表" />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
