<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesCalTeamApi } from '#/api/mes/cal/team';

import { nextTick, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTeamPage } from '#/api/mes/cal/team';

import { useTeamSelectGridColumns, useTeamSelectGridFormSchema } from '../data';

const emit = defineEmits<{ selected: [rows: MesCalTeamApi.Team[]] }>();
const open = ref(false); // 弹窗是否打开
const multiple = ref(true); // 是否多选
const selectedRows = ref<MesCalTeamApi.Team[]>([]); // 已选班组列表
const preSelectedIds = ref<number[]>([]); // 预选班组编号列表

/** 处理勾选变化 */
function handleCheckboxChange({ records }: { records: MesCalTeamApi.Team[] }) {
  selectedRows.value = records;
}

/** 处理全选变化 */
function handleCheckboxAll({ records }: { records: MesCalTeamApi.Team[] }) {
  selectedRows.value = records;
}

/** 双击行：多选切换勾选，单选直接确认 */
function handleCellDblclick({ row }: { row: MesCalTeamApi.Team }) {
  if (multiple.value) {
    const records = gridApi.grid.getCheckboxRecords() as MesCalTeamApi.Team[];
    const checked = records.some((item) => item.id === row.id);
    gridApi.grid.setCheckboxRow(row, !checked);
    selectedRows.value = gridApi.grid.getCheckboxRecords() as MesCalTeamApi.Team[];
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
  selectedRows.value = gridApi.grid.getCheckboxRecords() as MesCalTeamApi.Team[];
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
      ajax: {
        query: async ({ page }, formValues) =>
          await getTeamPage({ pageNo: page.currentPage, pageSize: page.pageSize, ...formValues }),
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
async function resetQueryState() {
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
  await gridApi.formApi.resetForm();
}

/** 打开班组选择弹窗 */
async function openModal(selectedIds?: number[], options?: { multiple?: boolean }) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  applyPreSelection();
}

/** 关闭班组选择弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择班组 */
function handleConfirm() {
  if (selectedRows.value.length === 0) {
    message.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
    return;
  }
  emit('selected', multiple.value ? selectedRows.value : [selectedRows.value[0]!]);
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <Modal
    v-model:open="open"
    title="班组选择"
    width="720px"
    :destroy-on-close="true"
    @ok="handleConfirm"
    @cancel="closeModal"
  >
    <Grid table-title="班组列表" />
  </Modal>
</template>
