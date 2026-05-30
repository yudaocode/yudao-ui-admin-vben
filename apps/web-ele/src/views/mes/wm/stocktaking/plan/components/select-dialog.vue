<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmStockTakingPlanApi } from '#/api/mes/wm/stocktaking/plan';

import { nextTick, ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getStockTakingPlanPage } from '#/api/mes/wm/stocktaking/plan';

import { useSelectGridColumns, useSelectGridFormSchema } from '../data';

const emit = defineEmits<{
  selected: [rows: MesWmStockTakingPlanApi.StockTakingPlan[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(true); // 是否多选
const selectedRows = ref<MesWmStockTakingPlanApi.StockTakingPlan[]>([]); // 已选盘点方案
const preSelectedIds = ref<number[]>([]); // 预选盘点方案编号

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<
    number,
    MesWmStockTakingPlanApi.StockTakingPlan
  >();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesWmStockTakingPlanApi.StockTakingPlan[];
  records.forEach((row) => {
    if (row.id != null) {
      selectedMap.set(row.id, row);
    }
  });
  return [...selectedMap.values()];
}

/** 处理勾选变化 */
function handleCheckboxSelectChange() {
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理单选变化 */
function handleRadioChange(row: MesWmStockTakingPlanApi.StockTakingPlan) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(
  row: MesWmStockTakingPlanApi.StockTakingPlan,
) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击：单选直接确认；多选切换勾选 */
async function handleCellDblclick({
  row,
}: {
  row: MesWmStockTakingPlanApi.StockTakingPlan;
}) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选盘点方案 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesWmStockTakingPlanApi.StockTakingPlan[];
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
    schema: useSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useSelectGridColumns(true),
    height: 480,
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
          return await getStockTakingPlanPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            // 选择器只展示启用状态的方案
            status: CommonStatusEnum.ENABLE,
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
  } as VxeTableGridOptions<MesWmStockTakingPlanApi.StockTakingPlan>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({
      row,
    }: {
      row: MesWmStockTakingPlanApi.StockTakingPlan;
    }) => {
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

/** 打开盘点方案选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  gridApi.setGridOptions({
    columns: useSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭弹窗 */
function closeModal() {
  open.value = false;
}

/** 确认选择 */
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
    destroy-on-close
    title="盘点方案选择"
    width="70%"
    @close="closeModal"
  >
    <Grid table-title="盘点方案列表" />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
