<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmSalesNoticeApi } from '#/api/mes/wm/salesnotice';

import { markRaw, nextTick, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSalesNoticePage } from '#/api/mes/wm/salesnotice';
import { MdClientSelect } from '#/views/mes/md/client/components';

const emit = defineEmits<{
  selected: [rows: MesWmSalesNoticeApi.SalesNotice[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选
const fixedStatus = ref<number>(); // 固定状态筛选
const selectedRows = ref<MesWmSalesNoticeApi.SalesNotice[]>([]); // 已选通知单列表
const preSelectedIds = ref<number[]>([]); // 预选通知单编号列表

/** 搜索表单：未固定状态时展示状态下拉，固定状态时隐藏 */
function useSearchSchema(hasFixedStatus: boolean): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '通知单编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入通知单编号',
      },
    },
    {
      fieldName: 'name',
      label: '通知单名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入通知单名称',
      },
    },
    {
      fieldName: 'salesOrderCode',
      label: '销售订单编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入销售订单编号',
      },
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        placeholder: '请选择客户',
      },
    },
    ...(hasFixedStatus
      ? []
      : [
          {
            fieldName: 'status',
            label: '单据状态',
            component: 'Select',
            componentProps: {
              clearable: true,
              options: getDictOptions(
                DICT_TYPE.MES_WM_SALES_NOTICE_STATUS,
                'number',
              ),
              placeholder: '请选择单据状态',
            },
          } as VbenFormSchema,
        ]),
  ];
}

/** 表格字段 */
function useGridColumns(
  multipleSelect = false,
): VxeTableGridOptions<MesWmSalesNoticeApi.SalesNotice>['columns'] {
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
      field: 'salesOrderCode',
      title: '销售订单编号',
      minWidth: 140,
    },
    {
      field: 'clientName',
      title: '客户名称',
      minWidth: 120,
    },
    {
      field: 'salesDate',
      title: '发货日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'status',
      title: '单据状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_SALES_NOTICE_STATUS },
      },
    },
  ];
}

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesWmSalesNoticeApi.SalesNotice>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesWmSalesNoticeApi.SalesNotice[];
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
function handleRadioChange(row: MesWmSalesNoticeApi.SalesNotice) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesWmSalesNoticeApi.SalesNotice) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击：单选直接确认，多选切换勾选 */
async function handleCellDblclick({
  row,
}: {
  row: MesWmSalesNoticeApi.SalesNotice;
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
  const rows = gridApi.grid.getData() as MesWmSalesNoticeApi.SalesNotice[];
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
    schema: useSearchSchema(false),
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
          return await getSalesNoticePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            // 固定状态优先，未固定时用搜索表单里的状态
            status: fixedStatus.value ?? formValues.status,
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
  } as VxeTableGridOptions<MesWmSalesNoticeApi.SalesNotice>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesWmSalesNoticeApi.SalesNotice }) => {
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
  // 固定状态时隐藏状态搜索项，未固定时展示
  gridApi.formApi.setState({
    schema: useSearchSchema(fixedStatus.value !== undefined),
  });
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
    title="发货通知单选择"
    width="70%"
    destroy-on-close
    @close="closeModal"
  >
    <Grid table-title="发货通知单列表" />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
