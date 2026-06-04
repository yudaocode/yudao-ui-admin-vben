<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmArrivalNoticeApi } from '#/api/mes/wm/arrivalnotice';

import { nextTick, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getArrivalNoticePage } from '#/api/mes/wm/arrivalnotice';

const emit = defineEmits<{
  selected: [rows: MesWmArrivalNoticeApi.ArrivalNotice[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选
const fixedStatus = ref<number>(); // 固定状态筛选
const syncingSingleSelection = ref(false); // 是否同步单选勾选状态
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
      fieldName: 'purchaseOrderCode',
      label: '采购订单编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入采购订单编号',
      },
    },
  ];
}

/** 表格字段 */
function useGridColumns(): VxeTableGridOptions<MesWmArrivalNoticeApi.ArrivalNotice>['columns'] {
  return [
    {
      type: 'checkbox',
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

/** 单选模式下同步 VXE 勾选状态，避免跨页残留多选 */
async function syncSingleSelection(row?: MesWmArrivalNoticeApi.ArrivalNotice) {
  syncingSingleSelection.value = true;
  await nextTick();
  await gridApi.grid.clearCheckboxRow();
  if (row) {
    await gridApi.grid.setCheckboxRow(row, true);
  }
  await nextTick();
  syncingSingleSelection.value = false;
}

/** 处理勾选变化，单选模式只保留最后一条 */
async function handleCheckboxChange({
  checked,
  records,
  row,
}: {
  checked: boolean;
  records: MesWmArrivalNoticeApi.ArrivalNotice[];
  row?: MesWmArrivalNoticeApi.ArrivalNotice;
}) {
  if (syncingSingleSelection.value) {
    return;
  }
  if (!multiple.value) {
    const selected = checked && row ? [row] : [];
    selectedRows.value = selected;
    await syncSingleSelection(selected[0]);
    return;
  }
  selectedRows.value = records;
}

/** 处理全选变化 */
function handleCheckboxAll({
  records,
}: {
  records: MesWmArrivalNoticeApi.ArrivalNotice[];
}) {
  if (syncingSingleSelection.value) {
    return;
  }
  selectedRows.value = records;
}

/** 回显预选通知单 */
function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesWmArrivalNoticeApi.ArrivalNotice[];
  for (const row of rows) {
    if (row.id && preSelectedIds.value.includes(row.id)) {
      gridApi.grid.setCheckboxRow(row, true);
      if (!multiple.value) {
        selectedRows.value = [row];
      }
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSearchSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 520,
    keepSource: true,
    checkboxConfig: {
      highlight: true,
      range: true,
      reserve: true,
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
    checkboxAll: handleCheckboxAll,
    checkboxChange: handleCheckboxChange,
  },
});

/** 重置查询和选择状态 */
async function resetQueryState() {
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
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
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  applyPreSelection();
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
    title="到货通知单选择"
    width="70%"
    destroy-on-close
    @close="closeModal"
  >
    <Grid table-title="到货通知单列表" />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
