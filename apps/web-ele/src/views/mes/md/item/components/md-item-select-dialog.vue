<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdItemApi } from '#/api/mes/md/item';
import type { MesMdItemTypeApi } from '#/api/mes/md/item/type';

import { nextTick, ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';

import { ElButton, ElCard, ElDialog, ElMessage } from 'element-plus';

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
const syncingSingleSelection = ref(false); // 是否同步单选勾选状态
const selectedRows = ref<MesMdItemApi.Item[]>([]); // 已选物料列表
const selectedItemTypeId = ref<number>(); // 当前筛选分类编号
const preSelectedIds = ref<number[]>([]); // 预选物料编号列表
const typeTreeRef = ref<InstanceType<typeof MdItemTypeTree>>(); // 物料分类树

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

/** 处理全选变化 */
function handleCheckboxAll({ records }: { records: MesMdItemApi.Item[] }) {
  if (syncingSingleSelection.value) {
    return;
  }
  selectedRows.value = records;
}

/** 按分类筛选物料 */
function handleItemTypeNodeClick(row: MesMdItemTypeApi.ItemType | undefined) {
  selectedItemTypeId.value = row?.id;
  gridApi.query();
}

/** 回显预选物料 */
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

/** 重置查询和选择状态 */
async function resetQueryState() {
  selectedItemTypeId.value = undefined;
  selectedRows.value = [];
  typeTreeRef.value?.reset();
  await gridApi.grid.clearCheckboxRow();
  await gridApi.formApi.resetForm();
}

/** 打开物料选择弹窗 */
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

/** 关闭物料选择弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择物料 */
function handleConfirm() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
    return;
  }
  emit('selected', multiple.value ? selectedRows.value : [selectedRows.value[0]!]);
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <ElDialog
    v-model="open"
    title="物料产品选择"
    width="80%"
    destroy-on-close
    @close="closeModal"
  >
    <div class="flex h-full w-full">
      <ElCard class="mr-4 h-full w-1/5">
        <MdItemTypeTree ref="typeTreeRef" @node-click="handleItemTypeNodeClick" />
      </ElCard>
      <div class="w-4/5">
        <Grid table-title="物料产品列表" />
      </div>
    </div>
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
