<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProTaskApi } from '#/api/mes/pro/task';

import { computed, nextTick, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { ElAlert, ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTaskPage } from '#/api/mes/pro/task';

import { useTaskSelectGridColumns, useTaskSelectGridFormSchema } from '../data';

const props = withDefaults(
  defineProps<{
    statuses?: number[];
  }>(),
  {
    statuses: undefined,
  },
);
const emit = defineEmits<{
  selected: [rows: MesProTaskApi.Task[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选；默认按单选选择器使用
const selectedRows = ref<MesProTaskApi.Task[]>([]); // 已选任务列表
const preSelectedIds = ref<number[]>([]); // 预选任务编号列表
const externalWorkOrderId = ref<number>(); // 外部传入的默认工单过滤
const externalWorkstationId = ref<number>(); // 外部传入的默认工位过滤

const statusTip = computed(() => {
  if (!props.statuses?.length) {
    return '';
  }
  const labels = props.statuses
    .map((value) => getDictLabel(DICT_TYPE.MES_PRO_TASK_STATUS, value))
    .filter(Boolean)
    .join('、');
  return `仅展示状态为【${labels}】的任务`;
});

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesProTaskApi.Task>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesProTaskApi.Task[];
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
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理单选切换 */
function handleRadioChange(row: MesProTaskApi.Task) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesProTaskApi.Task) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击：单选直接确认，多选切换勾选 */
async function handleCellDblclick({ row }: { row: MesProTaskApi.Task }) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选任务 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesProTaskApi.Task[];
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
    schema: useTaskSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useTaskSelectGridColumns(false),
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
          return await getTaskPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            statuses: props.statuses,
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
  } as VxeTableGridOptions<MesProTaskApi.Task>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesProTaskApi.Task }) => {
      handleRadioChange(row);
    },
  },
});

/** 重置查询和选择状态，保留外部传入的工单/工位默认过滤 */
async function resetQueryState() {
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.resetForm();
  if (externalWorkOrderId.value) {
    await gridApi.formApi.setFieldValue(
      'workOrderId',
      externalWorkOrderId.value,
    );
  }
  if (externalWorkstationId.value) {
    await gridApi.formApi.setFieldValue(
      'workstationId',
      externalWorkstationId.value,
    );
  }
}

/** 打开任务选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: {
    multiple?: boolean;
    workOrderId?: number;
    workstationId?: number;
  },
) {
  open.value = true;
  multiple.value = options?.multiple ?? false;
  preSelectedIds.value = selectedIds || [];
  externalWorkOrderId.value = options?.workOrderId;
  externalWorkstationId.value = options?.workstationId;
  await nextTick();
  gridApi.setGridOptions({
    columns: useTaskSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭任务选择弹窗 */
function closeModal() {
  open.value = false;
}

/** 确认选择任务 */
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
    title="生产任务选择"
    width="80%"
    destroy-on-close
    @close="closeModal"
  >
    <ElAlert
      v-if="statusTip"
      :title="statusTip"
      type="info"
      :closable="false"
      show-icon
      class="!mb-3"
    />
    <Grid table-title="生产任务列表" />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
