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

const open = ref(false);
const multiple = ref(true);
const syncingSingleSelection = ref(false);
const selectedRows = ref<MesMdItemApi.Item[]>([]);
const selectedItemTypeId = ref<number>();
const preSelectedIds = ref<number[]>([]);
const typeTreeRef = ref<InstanceType<typeof MdItemTypeTree>>();

/** 单选模式下同步 VXE 勾选状态，避免跨页残留多选 */
async function syncSingleSelection(row?: MesMdItemApi.Item) {
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
  records: MesMdItemApi.Item[];
  row?: MesMdItemApi.Item;
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

function handleCheckboxAll({ records }: { records: MesMdItemApi.Item[] }) {
  if (syncingSingleSelection.value) {
    return;
  }
  selectedRows.value = records;
}

function handleItemTypeNodeClick(row: MesMdItemTypeApi.ItemType | undefined) {
  selectedItemTypeId.value = row?.id;
  gridApi.query();
}

function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesMdItemApi.Item[];
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
    schema: useItemSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useItemSelectGridColumns(),
    height: 560,
    keepSource: true,
    checkboxConfig: {
      highlight: true,
      range: true,
      reserve: true,
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
    checkboxAll: handleCheckboxAll,
    checkboxChange: handleCheckboxChange,
  },
});

async function resetQueryState() {
  selectedItemTypeId.value = undefined;
  selectedRows.value = [];
  typeTreeRef.value?.reset();
  await gridApi.grid.clearCheckboxRow();
  await gridApi.formApi.resetForm();
}

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

async function closeModal() {
  open.value = false;
  await resetQueryState();
}

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
    title="物料产品选择"
    width="80%"
    :destroy-on-close="true"
    @ok="handleConfirm"
    @cancel="closeModal"
  >
    <div class="flex h-full w-full">
      <Card class="mr-4 h-full w-1/5">
        <MdItemTypeTree ref="typeTreeRef" @node-click="handleItemTypeNodeClick" />
      </Card>
      <div class="w-4/5">
        <Grid table-title="物料产品列表" />
      </div>
    </div>
  </Modal>
</template>
