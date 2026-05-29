<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';

import { computed, nextTick, ref } from 'vue';

import { ElAlert, ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMaterialStockPage } from '#/api/mes/wm/materialstock';
import MdItemTypeTree from '#/views/mes/md/item/type/components/md-item-type-tree.vue';

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
const multiple = ref(true);
const syncingSingleSelection = ref(false);
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

/** 单选模式同步 VXE 勾选状态 */
async function syncSingleSelection(row?: MesWmMaterialStockApi.MaterialStock) {
  syncingSingleSelection.value = true;
  await nextTick();
  await gridApi.grid.clearCheckboxRow();
  if (row) {
    await gridApi.grid.setCheckboxRow(row, true);
  }
  await nextTick();
  syncingSingleSelection.value = false;
}

/** 处理勾选变化 */
async function handleCheckboxChange({
  checked,
  records,
  row,
}: {
  checked: boolean;
  records: MesWmMaterialStockApi.MaterialStock[];
  row?: MesWmMaterialStockApi.MaterialStock;
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
  records: MesWmMaterialStockApi.MaterialStock[];
}) {
  if (syncingSingleSelection.value) {
    return;
  }
  selectedRows.value = records;
}

/** 双击行：单选直接确认；多选切换勾选 */
async function handleRowDblclick({
  row,
}: {
  row: MesWmMaterialStockApi.MaterialStock;
}) {
  if (multiple.value) {
    const checked = !gridApi.grid.isCheckedByCheckboxRow(row);
    await gridApi.grid.setCheckboxRow(row, checked);
    handleCheckboxChange({
      checked,
      records:
        gridApi.grid.getCheckboxRecords() as MesWmMaterialStockApi.MaterialStock[],
      row,
    });
    return;
  }
  selectedRows.value = [row];
  await syncSingleSelection(row);
  handleConfirm();
}

/** 回显预选 */
function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesWmMaterialStockApi.MaterialStock[];
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
    schema: useSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useSelectGridColumns(),
    height: 480,
    keepSource: true,
    checkboxConfig: {
      highlight: true,
      range: true,
      reserve: true,
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
    checkboxAll: handleCheckboxAll,
    checkboxChange: handleCheckboxChange,
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
  await gridApi.formApi.resetForm();
}

/** 打开弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  applyPreSelection();
}

/** 关闭弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择 */
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
