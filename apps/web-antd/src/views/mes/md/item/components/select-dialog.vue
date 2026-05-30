<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdItemApi } from '#/api/mes/md/item';
import type { MesMdItemTypeApi } from '#/api/mes/md/item/type';

import { nextTick, ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';

import { Card, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getItemPage } from '#/api/mes/md/item';
import { MdItemTypeTree } from '#/views/mes/md/item/type/components';

import { useItemSelectGridColumns, useItemSelectGridFormSchema } from '../data';

defineOptions({ name: 'MdItemSelectDialog' });

const emit = defineEmits<{
  selected: [rows: MesMdItemApi.Item[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(true); // 是否多选
const selectedRows = ref<MesMdItemApi.Item[]>([]); // 已选物料列表
const selectedItemTypeId = ref<number>(); // 当前筛选分类编号
const preSelectedIds = ref<number[]>([]); // 预选物料编号列表
const typeTreeRef = ref<InstanceType<typeof MdItemTypeTree>>(); // 物料分类树

/** 获取当前表格数据 */
function getTableRows() {
  return gridApi.grid.getTableData().fullData as MesMdItemApi.Item[];
}

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesMdItemApi.Item>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesMdItemApi.Item[];
  records.forEach((row) => {
    const rowId = row.id;
    if (rowId != null) {
      selectedMap.set(rowId, row);
    }
  });
  return [...selectedMap.values()];
}

/** 处理勾选变化 */
function handleCheckboxSelectChange() {
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理单选变化 */
function handleRadioChange(row: MesMdItemApi.Item) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesMdItemApi.Item) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击 */
async function handleCellDblclick({ row }: { row: MesMdItemApi.Item }) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 按分类筛选物料 */
function handleItemTypeNodeClick(row: MesMdItemTypeApi.ItemType | undefined) {
  selectedItemTypeId.value = row?.id;
  gridApi.query();
}

/** 回显预选物料 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = getTableRows();
  for (const row of rows) {
    if (row.id == null || !preSelectedIds.value.includes(row.id)) {
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
    schema: useItemSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useItemSelectGridColumns(true),
    height: 560,
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
          return await getItemPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            itemTypeId: selectedItemTypeId.value,
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
  } as VxeTableGridOptions<MesMdItemApi.Item>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesMdItemApi.Item }) => {
      handleRadioChange(row);
    },
  },
});

/** 重置查询和选择状态 */
async function resetQueryState() {
  selectedItemTypeId.value = undefined;
  selectedRows.value = [];
  typeTreeRef.value?.reset();
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.resetForm();
}

/** 打开物料选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  gridApi.setGridOptions({
    columns: useItemSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭物料选择弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择物料 */
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
    title="物料产品选择"
    width="80%"
    :destroy-on-close="true"
    @ok="handleConfirm"
    @cancel="closeModal"
  >
    <div class="flex h-full w-full">
      <Card class="mr-4 h-full w-1/5">
        <MdItemTypeTree
          ref="typeTreeRef"
          @node-click="handleItemTypeNodeClick"
        />
      </Card>
      <div class="w-4/5">
        <Grid table-title="物料产品列表" />
      </div>
    </div>
  </Modal>
</template>
