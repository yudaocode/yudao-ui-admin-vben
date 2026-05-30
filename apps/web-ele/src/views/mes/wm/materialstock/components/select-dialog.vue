<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';

import { computed, nextTick, ref } from 'vue';

import { ElAlert, ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMaterialStockPage } from '#/api/mes/wm/materialstock';
import { MdItemTypeTree } from '#/views/mes/md/item/type/components';

import { useSelectGridColumns, useSelectGridFormSchema } from '../data';

/** 虚拟仓过滤模式：'exclude' 排除虚拟仓（默认），'only' 只看虚拟仓，'all' 不过滤 */
type VirtualFilter = 'all' | 'exclude' | 'only';

const props = withDefaults(
  defineProps<{
    batchId?: number;
    itemId?: number;
    virtualFilter?: VirtualFilter;
    warehouseId?: number;
  }>(),
  {
    batchId: undefined,
    itemId: undefined,
    virtualFilter: 'exclude',
    warehouseId: undefined,
  },
);

const emit = defineEmits<{
  selected: [rows: MesWmMaterialStockApi.MaterialStock[]];
}>();

const open = ref(false);
const multiple = ref(false); // 是否多选；默认按单选选择器使用
const selectedRows = ref<MesWmMaterialStockApi.MaterialStock[]>([]);
const preSelectedIds = ref<number[]>([]);
const searchItemTypeId = ref<number>();

/** 当前 props 是否带预过滤 */
const showAlert = computed(
  () =>
    props.batchId != null ||
    props.warehouseId != null ||
    props.virtualFilter === 'only',
);

/** 预过滤提示文字 */
const alertTitle = computed(() => {
  const parts: string[] = [];
  if (props.batchId != null) {
    parts.push('批次');
  }
  if (props.warehouseId != null) {
    parts.push('仓库');
  }
  if (props.virtualFilter === 'only') {
    parts.push('只看虚拟仓');
  }
  return `已按${parts.join('/')}预过滤`;
});

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, MesWmMaterialStockApi.MaterialStock>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as MesWmMaterialStockApi.MaterialStock[];
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
function handleRadioChange(row: MesWmMaterialStockApi.MaterialStock) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: MesWmMaterialStockApi.MaterialStock) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 双击行：单选直接确认；多选切换勾选 */
async function handleRowDblclick({
  row,
}: {
  row: MesWmMaterialStockApi.MaterialStock;
}) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesWmMaterialStockApi.MaterialStock[];
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
    schema: useSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useSelectGridColumns(false),
    height: 480,
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
          return await getMaterialStockPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            batchId: props.batchId,
            // 默认查未冻结
            frozen: false,
            itemTypeId: searchItemTypeId.value,
            itemId: formValues.itemId ?? props.itemId,
            warehouseId: formValues.warehouseId ?? props.warehouseId,
            virtualFilter:
              props.virtualFilter === 'all' ? undefined : props.virtualFilter,
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
  } as VxeTableGridOptions<MesWmMaterialStockApi.MaterialStock>,
  gridEvents: {
    cellDblclick: handleRowDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: MesWmMaterialStockApi.MaterialStock }) => {
      handleRadioChange(row);
    },
  },
});

/** 物料分类树节点点击 */
function handleTypeNodeClick(row: undefined | { id?: number }) {
  searchItemTypeId.value = row?.id;
  gridApi.query();
}

/** 重置查询和选择状态 */
async function resetQueryState() {
  selectedRows.value = [];
  searchItemTypeId.value = undefined;
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.resetForm();
}

/** 打开弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? false;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  gridApi.setGridOptions({
    columns: useSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择 */
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
  <ElDialog
    v-model="open"
    destroy-on-close
    title="库存物资选择"
    width="80%"
    @close="closeModal"
  >
    <ElAlert
      v-if="showAlert"
      class="mb-3"
      :closable="false"
      show-icon
      :title="alertTitle"
      type="info"
    />
    <div class="flex gap-3">
      <div class="bg-card w-1/6 rounded p-2">
        <MdItemTypeTree @node-click="handleTypeNodeClick" />
      </div>
      <div class="w-5/6">
        <Grid table-title="库存列表" />
      </div>
    </div>
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
