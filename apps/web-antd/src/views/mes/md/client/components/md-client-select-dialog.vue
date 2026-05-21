<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdClientApi } from '#/api/mes/md/client';

import { nextTick, ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';

import { message, Modal } from 'ant-design-vue';

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
const syncingSingleSelection = ref(false); // 是否同步单选勾选状态
const selectedRows = ref<MesMdClientApi.Client[]>([]); // 已选客户列表
const preSelectedIds = ref<number[]>([]); // 预选客户编号列表

/** 单选模式下同步 VXE 勾选状态，避免跨页残留多选 */
async function syncSingleSelection(row?: MesMdClientApi.Client) {
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
  records: MesMdClientApi.Client[];
  row?: MesMdClientApi.Client;
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
function handleCheckboxAll({ records }: { records: MesMdClientApi.Client[] }) {
  if (syncingSingleSelection.value) {
    return;
  }
  selectedRows.value = records;
}

/** 回显预选客户 */
function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesMdClientApi.Client[];
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
    schema: useClientSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useClientSelectGridColumns(),
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
          return await getClientPage({
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
  } as VxeTableGridOptions<MesMdClientApi.Client>,
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

/** 打开客户选择弹窗 */
async function openModal(selectedIds?: number[], options?: { multiple?: boolean }) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  applyPreSelection();
}

/** 关闭客户选择弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择客户 */
function handleConfirm() {
  if (selectedRows.value.length === 0) {
    message.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
    return;
  }
  emit('selected', multiple.value ? selectedRows.value : [selectedRows.value[0]!]);
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <Modal
    v-model:open="open"
    title="客户选择"
    width="70%"
    :destroy-on-close="true"
    @ok="handleConfirm"
    @cancel="closeModal"
  >
    <Grid table-title="客户列表" />
  </Modal>
</template>
