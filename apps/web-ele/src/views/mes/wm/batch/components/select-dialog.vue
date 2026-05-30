<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmBatchApi } from '#/api/mes/wm/batch';

import { computed, nextTick, ref } from 'vue';

import { ElAlert, ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBatchPage } from '#/api/mes/wm/batch';

import { useBatchSelectGridColumns, useBatchSelectGridFormSchema } from '../data';

const emit = defineEmits<{
  selected: [rows: MesWmBatchApi.Batch[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选；默认按单选选择器使用
const selectedRows = ref<MesWmBatchApi.Batch[]>([]); // 已选批次列表
const preSelectedIds = ref<number[]>([]); // 预选批次编号列表
const externalItemId = ref<number>(); // 外部传入的默认物料过滤
const externalClientId = ref<number>(); // 外部传入的默认客户过滤
const externalVendorId = ref<number>(); // 外部传入的默认供应商过滤
const externalSalesOrderCode = ref<string>(); // 外部传入的默认销售订单过滤

const filterTip = computed(() => {
  const parts: string[] = [];
  if (externalClientId.value != null) {
    parts.push('客户');
  }
  if (externalVendorId.value != null) {
    parts.push('供应商');
  }
  if (externalSalesOrderCode.value != null) {
    parts.push('销售订单');
  }
  return parts.length > 0 ? `已按${parts.join('/')}预过滤` : '';
});

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesWmBatchApi.Batch>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesWmBatchApi.Batch[];
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
function handleRadioChange(row: MesWmBatchApi.Batch) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesWmBatchApi.Batch) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击：单选直接确认，多选切换勾选 */
async function handleCellDblclick({ row }: { row: MesWmBatchApi.Batch }) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选批次 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesWmBatchApi.Batch[];
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
    schema: useBatchSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useBatchSelectGridColumns(false),
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
          return await getBatchPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
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
  } as VxeTableGridOptions<MesWmBatchApi.Batch>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesWmBatchApi.Batch }) => {
      handleRadioChange(row);
    },
  },
});

/** 重置查询和选择状态，保留外部传入的默认过滤 */
async function resetQueryState() {
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.resetForm();
  if (externalItemId.value) {
    await gridApi.formApi.setFieldValue('itemId', externalItemId.value);
  }
  if (externalClientId.value) {
    await gridApi.formApi.setFieldValue('clientId', externalClientId.value);
  }
  if (externalVendorId.value) {
    await gridApi.formApi.setFieldValue('vendorId', externalVendorId.value);
  }
  if (externalSalesOrderCode.value) {
    await gridApi.formApi.setFieldValue(
      'salesOrderCode',
      externalSalesOrderCode.value,
    );
  }
}

/** 打开批次选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: {
    clientId?: number;
    itemId?: number;
    multiple?: boolean;
    salesOrderCode?: string;
    vendorId?: number;
  },
) {
  open.value = true;
  multiple.value = options?.multiple ?? false;
  preSelectedIds.value = selectedIds || [];
  externalItemId.value = options?.itemId;
  externalClientId.value = options?.clientId;
  externalVendorId.value = options?.vendorId;
  externalSalesOrderCode.value = options?.salesOrderCode;
  await nextTick();
  gridApi.setGridOptions({
    columns: useBatchSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭批次选择弹窗 */
function closeModal() {
  open.value = false;
}

/** 确认选择批次 */
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
  <ElDialog v-model="open" title="批次选择" width="80%">
    <ElAlert
      v-if="filterTip"
      :closable="false"
      class="!mb-3"
      :title="filterTip"
      type="info"
    />
    <Grid table-title="批次列表" />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
