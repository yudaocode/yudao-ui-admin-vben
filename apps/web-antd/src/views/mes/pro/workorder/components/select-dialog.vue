<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';

import { computed, nextTick, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { Alert, Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWorkOrderPage } from '#/api/mes/pro/workorder';

import {
  useWorkOrderSelectGridColumns,
  useWorkOrderSelectGridFormSchema,
} from '../data';

const props = withDefaults(
  defineProps<{
    status?: number;
    type?: number;
  }>(),
  {
    status: undefined,
    type: undefined,
  },
);
const emit = defineEmits<{
  selected: [rows: MesProWorkOrderApi.WorkOrder[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选；默认按单选选择器使用
const selectedRows = ref<MesProWorkOrderApi.WorkOrder[]>([]); // 已选工单列表
const preSelectedIds = ref<number[]>([]); // 预选工单编号列表

const typeTip = computed(() => {
  if (props.type == null) {
    return '';
  }
  return `仅展示【${getDictLabel(DICT_TYPE.MES_PRO_WORK_ORDER_TYPE, props.type)}】类型的工单`;
});

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesProWorkOrderApi.WorkOrder>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesProWorkOrderApi.WorkOrder[];
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
function handleRadioChange(row: MesProWorkOrderApi.WorkOrder) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesProWorkOrderApi.WorkOrder) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击：单选直接确认，多选切换勾选 */
async function handleCellDblclick({ row }: { row: MesProWorkOrderApi.WorkOrder }) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选工单 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesProWorkOrderApi.WorkOrder[];
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
    schema: useWorkOrderSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useWorkOrderSelectGridColumns(false),
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
          return await getWorkOrderPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            type: props.type,
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
  } as VxeTableGridOptions<MesProWorkOrderApi.WorkOrder>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesProWorkOrderApi.WorkOrder }) => {
      handleRadioChange(row);
    },
  },
});

/** 重置查询和选择状态，保留外部传入的默认状态过滤 */
async function resetQueryState() {
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.resetForm();
  if (props.status != null) {
    await gridApi.formApi.setFieldValue('status', props.status);
  }
}

/** 打开工单选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? false;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  gridApi.setGridOptions({
    columns: useWorkOrderSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭工单选择弹窗 */
function closeModal() {
  open.value = false;
}

/** 确认选择工单 */
function handleConfirm() {
  const rows = multiple.value ? getMultipleSelectedRows() : selectedRows.value;
  if (rows.length === 0) {
    message.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
    return;
  }
  emit('selected', multiple.value ? rows : [rows[0]!]);
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <Modal
    v-model:open="open"
    title="生产工单选择"
    width="80%"
    :destroy-on-close="true"
    @ok="handleConfirm"
    @cancel="closeModal"
  >
    <Alert
      v-if="typeTip"
      :message="typeTip"
      type="info"
      show-icon
      class="!mb-3"
    />
    <Grid table-title="生产工单列表" />
    <template #footer>
      <Button @click="closeModal">取消</Button>
      <Button type="primary" @click="handleConfirm">确定</Button>
    </template>
  </Modal>
</template>
