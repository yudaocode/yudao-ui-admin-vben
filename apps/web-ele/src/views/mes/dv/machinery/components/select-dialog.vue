<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvMachineryApi } from '#/api/mes/dv/machinery';
import type { MesDvMachineryTypeApi } from '#/api/mes/dv/machinery/type';

import { nextTick, ref } from 'vue';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMachineryPage } from '#/api/mes/dv/machinery';
import { MachineryTypeTree } from '#/views/mes/dv/machinery/type/components';

import {
  useMachinerySelectGridColumns,
  useMachinerySelectGridFormSchema,
} from '../data';

defineOptions({ name: 'DvMachinerySelectDialog' });

const emit = defineEmits<{
  selected: [rows: MesDvMachineryApi.Machinery[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选
const selectedRows = ref<MesDvMachineryApi.Machinery[]>([]); // 已选设备列表
const selectedMachineryTypeId = ref<number>(); // 当前筛选设备类型编号
const preSelectedIds = ref<number[]>([]); // 预选设备编号列表
const typeTreeRef = ref<InstanceType<typeof MachineryTypeTree>>(); // 设备类型树

/** 获取当前表格数据 */
function getTableRows() {
  return gridApi.grid.getTableData().fullData as MesDvMachineryApi.Machinery[];
}

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesDvMachineryApi.Machinery>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesDvMachineryApi.Machinery[];
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
function handleRadioChange(row: MesDvMachineryApi.Machinery) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesDvMachineryApi.Machinery) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击 */
async function handleCellDblclick({ row }: { row: MesDvMachineryApi.Machinery }) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 按设备类型筛选 */
function handleTypeNodeClick(row: MesDvMachineryTypeApi.MachineryType | undefined) {
  selectedMachineryTypeId.value = row?.id;
  gridApi.query();
}

/** 回显预选设备 */
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
    schema: useMachinerySelectGridFormSchema(),
  },
  gridOptions: {
    columns: useMachinerySelectGridColumns(false),
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
          return await getMachineryPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            machineryTypeId: selectedMachineryTypeId.value,
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
  } as VxeTableGridOptions<MesDvMachineryApi.Machinery>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesDvMachineryApi.Machinery }) => {
      handleRadioChange(row);
    },
  },
});

/** 重置查询和选择状态 */
async function resetQueryState() {
  selectedMachineryTypeId.value = undefined;
  selectedRows.value = [];
  typeTreeRef.value?.reset();
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.resetForm();
}

/** 打开设备选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? false;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  gridApi.setGridOptions({
    columns: useMachinerySelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭设备选择弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择设备 */
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
    title="设备选择"
    width="80%"
    destroy-on-close
    @close="closeModal"
  >
    <div class="flex h-full w-full">
      <div class="mr-4 h-full w-1/5">
        <MachineryTypeTree ref="typeTreeRef" @node-click="handleTypeNodeClick" />
      </div>
      <div class="w-4/5">
        <Grid table-title="设备列表" />
      </div>
    </div>
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
