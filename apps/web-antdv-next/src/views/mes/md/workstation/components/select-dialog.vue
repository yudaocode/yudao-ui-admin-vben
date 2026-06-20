<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdWorkstationApi } from '#/api/mes/md/workstation';

import { nextTick, ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';

import { message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWorkstationPage } from '#/api/mes/md/workstation';

import {
  useWorkstationSelectGridColumns,
  useWorkstationSelectGridFormSchema,
} from '../data';

const props = withDefaults(
  defineProps<{
    processId?: number;
  }>(),
  {
    processId: undefined,
  },
);
const emit = defineEmits<{
  selected: [rows: MesMdWorkstationApi.Workstation[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(true); // 是否多选
const selectedRows = ref<MesMdWorkstationApi.Workstation[]>([]); // 已选工作站列表
const preSelectedIds = ref<number[]>([]); // 预选工作站编号列表

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesMdWorkstationApi.Workstation>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesMdWorkstationApi.Workstation[];
  records.forEach((row) => {
    const rowId = row.id;
    if (rowId !== undefined) {
      selectedMap.set(rowId, row);
    }
  });
  return [...selectedMap.values()];
}

/** 处理多选勾选变化 */
function handleCheckboxSelectChange() {
  if (!multiple.value) {
    return;
  }
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理单选切换 */
function handleRadioChange(row: MesMdWorkstationApi.Workstation) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesMdWorkstationApi.Workstation) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击：单选直接确认，多选切换勾选 */
async function handleCellDblclick({
  row,
}: {
  row: MesMdWorkstationApi.Workstation;
}) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选工作站 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesMdWorkstationApi.Workstation[];
  for (const row of rows) {
    if (row.id === undefined || !preSelectedIds.value.includes(row.id)) {
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
    schema: useWorkstationSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useWorkstationSelectGridColumns(true),
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
          return await getWorkstationPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
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
  } as VxeTableGridOptions<MesMdWorkstationApi.Workstation>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesMdWorkstationApi.Workstation }) => {
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
  if (props.processId) {
    await gridApi.formApi.setFieldValue('processId', props.processId);
  }
}

/** 打开工作站选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  gridApi.setGridOptions({
    columns: useWorkstationSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭工作站选择弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择工作站 */
function handleConfirm() {
  if (selectedRows.value.length === 0) {
    message.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
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
  <Modal
    v-model:open="open"
    title="工作站选择"
    width="70%"
    :destroy-on-hidden="true"
    @ok="handleConfirm"
    @cancel="closeModal"
  >
    <Grid table-title="工作站列表" />
  </Modal>
</template>
