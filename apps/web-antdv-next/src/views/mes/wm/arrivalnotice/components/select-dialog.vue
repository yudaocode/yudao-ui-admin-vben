<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmArrivalNoticeApi } from '#/api/mes/wm/arrivalnotice';

import { nextTick, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getArrivalNoticePage } from '#/api/mes/wm/arrivalnotice';

const emit = defineEmits<{
  selected: [rows: MesWmArrivalNoticeApi.ArrivalNotice[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选
const fixedStatus = ref<number>(); // 固定状态筛选
const selectedRows = ref<MesWmArrivalNoticeApi.ArrivalNotice[]>([]); // 已选通知单列表
const preSelectedIds = ref<number[]>([]); // 预选通知单编号列表

/** 搜索表单 */
function useSearchSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '通知单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入通知单编号',
      },
    },
    {
      fieldName: 'name',
      label: '通知单名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入通知单名称',
      },
    },
    {
      fieldName: 'purchaseOrderCode',
      label: '采购订单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入采购订单编号',
      },
    },
  ];
}

/** 表格字段 */
function useGridColumns(
  multipleSelect = false,
): VxeTableGridOptions<MesWmArrivalNoticeApi.ArrivalNotice>['columns'] {
  return [
    {
      type: multipleSelect ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'code',
      title: '通知单编号',
      minWidth: 160,
    },
    {
      field: 'name',
      title: '通知单名称',
      minWidth: 150,
    },
    {
      field: 'purchaseOrderCode',
      title: '采购订单编号',
      minWidth: 140,
    },
    {
      field: 'vendorName',
      title: '供应商名称',
      minWidth: 120,
    },
    {
      field: 'arrivalDate',
      title: '到货日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'status',
      title: '单据状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS },
      },
    },
  ];
}

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesWmArrivalNoticeApi.ArrivalNotice>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesWmArrivalNoticeApi.ArrivalNotice[];
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
function handleRadioChange(row: MesWmArrivalNoticeApi.ArrivalNotice) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesWmArrivalNoticeApi.ArrivalNotice) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击：单选直接确认，多选切换勾选 */
async function handleCellDblclick({
  row,
}: {
  row: MesWmArrivalNoticeApi.ArrivalNotice;
}) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选通知单 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesWmArrivalNoticeApi.ArrivalNotice[];
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
    schema: useSearchSchema(),
  },
  gridOptions: {
    columns: useGridColumns(false),
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
          return await getArrivalNoticePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            status: fixedStatus.value,
            ...formValues,
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
  } as VxeTableGridOptions<MesWmArrivalNoticeApi.ArrivalNotice>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesWmArrivalNoticeApi.ArrivalNotice }) => {
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

/** 打开通知单选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean; status?: number },
) {
  open.value = true;
  multiple.value = options?.multiple ?? false;
  fixedStatus.value = options?.status;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  gridApi.setGridOptions({
    columns: useGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭通知单选择弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择通知单 */
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
    title="到货通知单选择"
    width="70%"
    :destroy-on-close="true"
    @cancel="closeModal"
    @ok="handleConfirm"
  >
    <Grid table-title="到货通知单列表" />
  </Modal>
</template>
