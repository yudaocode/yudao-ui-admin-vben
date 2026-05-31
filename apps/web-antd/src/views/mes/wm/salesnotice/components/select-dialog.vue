<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmSalesNoticeApi } from '#/api/mes/wm/salesnotice';

import { markRaw, nextTick, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSalesNoticePage } from '#/api/mes/wm/salesnotice';
import { MdClientSelect } from '#/views/mes/md/client/components';

const emit = defineEmits<{
  selected: [rows: MesWmSalesNoticeApi.SalesNotice[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选
const fixedStatus = ref<number>(); // 固定状态筛选
const syncingSingleSelection = ref(false); // 是否同步单选勾选状态
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
      fieldName: 'salesOrderCode',
      label: '销售订单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
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
              allowClear: true,
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
function useGridColumns(): VxeTableGridOptions<MesWmSalesNoticeApi.SalesNotice>['columns'] {
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

/** 单选模式下同步 VXE 勾选状态，避免跨页残留多选 */
async function syncSingleSelection(row?: MesWmSalesNoticeApi.SalesNotice) {
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
  records: MesWmSalesNoticeApi.SalesNotice[];
  row?: MesWmSalesNoticeApi.SalesNotice;
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
  records: MesWmSalesNoticeApi.SalesNotice[];
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
  const rows = gridApi.grid.getData() as MesWmSalesNoticeApi.SalesNotice[];
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
    schema: useSearchSchema(false),
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
  // 固定状态时隐藏状态搜索项，未固定时展示
  gridApi.formApi.setState({
    schema: useSearchSchema(fixedStatus.value != null),
  });
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
    title="发货通知单选择"
    width="70%"
    :destroy-on-close="true"
    @cancel="closeModal"
    @ok="handleConfirm"
  >
    <Grid table-title="发货通知单列表" />
  </Modal>
</template>
