<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdClientApi } from '#/api/mes/md/client';

import { nextTick, ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getClientPage } from '#/api/mes/md/client';

import {
  useClientSelectGridColumns,
  useClientSelectGridFormSchema,
} from '../data';

const emit = defineEmits<{
  selected: [rows: MesMdClientApi.Client[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(true); // 是否多选
const selectedRows = ref<MesMdClientApi.Client[]>([]); // 已选客户列表
const preSelectedIds = ref<number[]>([]); // 预选客户编号列表
const latestQueryRows = ref<MesMdClientApi.Client[]>([]); // 最近一次查询返回的客户列表
const queryFinished = ref(false); // 最近一次查询是否完成

// TODO @芋艿：是否有必要搞的这么复杂？？？后续测试看看。
const MAX_TABLE_READY_FRAMES = 60;

/** 等待下一帧 */
function waitNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/** 获取当前表格数据 */
function getTableRows() {
  return gridApi.grid.getTableData().fullData as MesMdClientApi.Client[];
}

/** 等待 VXE 将当前查询结果写入表格数据后再回显选中 */
async function waitTableReady(): Promise<void> {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  for (let index = 0; index < MAX_TABLE_READY_FRAMES; index += 1) {
    if (queryFinished.value) {
      const rows = getTableRows();
      if (latestQueryRows.value.length === 0 && rows.length === 0) {
        return;
      }
      if (latestQueryRows.value.length > 0 && rows.length > 0) {
        return;
      }
    }
    await waitNextFrame();
  }
}

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesMdClientApi.Client>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesMdClientApi.Client[];
  records.forEach((row) => {
    if (row.id !== null) {
      selectedMap.set(row.id as number, row);
    }
  });
  return [...selectedMap.values()];
}

/** 处理勾选变化 */
function handleCheckboxSelectChange() {
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理单选变化 */
function handleRadioChange(row: MesMdClientApi.Client) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesMdClientApi.Client) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击 */
async function handleCellDblclick({ row }: { row: MesMdClientApi.Client }) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选客户 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  // proxy 表格回显选中时要读取 fullData，否则首次打开可能读不到刚查询出的数据。
  const rows = getTableRows();
  for (const row of rows) {
    if (row.id === null || !preSelectedIds.value.includes(row.id as number)) {
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
    schema: useClientSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useClientSelectGridColumns(true),
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
          const data = await getClientPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            status: CommonStatusEnum.ENABLE,
          });
          latestQueryRows.value = data.list || [];
          queryFinished.value = true;
          return data;
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
  } as VxeTableGridOptions<MesMdClientApi.Client>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesMdClientApi.Client }) => {
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

/** 打开客户选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  preSelectedIds.value = selectedIds || [];
  latestQueryRows.value = [];
  queryFinished.value = false;
  await nextTick();
  gridApi.setGridOptions({
    columns: useClientSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await waitTableReady();
  await applyPreSelection();
}

/** 关闭客户选择弹窗 */
function closeModal() {
  open.value = false;
}

/** 确认选择客户 */
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
    title="客户选择"
    width="70%"
    destroy-on-close
    @close="closeModal"
  >
    <Grid table-title="客户列表" />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
