<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsInventoryApi } from '#/api/wms/inventory';

import { nextTick, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getInventoryPage } from '#/api/wms/inventory';
import { formatQuantity } from '#/views/wms/utils/format';

import {
  useInventorySelectGridColumns,
  useInventorySelectGridFormSchema,
} from '../index/data';

export interface InventorySelectRow extends WmsInventoryApi.Inventory {
  availableQuantity?: number;
  price?: number;
}

defineOptions({ name: 'WmsInventorySelect' });

const props = defineProps<{
  warehouseId?: number;
}>();

const emit = defineEmits<{
  change: [list: InventorySelectRow[]];
}>();

const open = ref(false);
const disabledInventoryKeys = ref<Set<string>>(new Set());

interface CellDblclickEvent {
  row: InventorySelectRow;
}

/** 获得行唯一标识 */
function getRowKey(row: InventorySelectRow) {
  return `inventory-${row.id || `${row.skuId}-${row.warehouseId}`}`;
}

/** 获得业务库存标识 */
function getInventoryKey(
  row: Pick<InventorySelectRow, 'skuId' | 'warehouseId'>,
) {
  return row.skuId && row.warehouseId
    ? `${row.skuId}-${row.warehouseId}`
    : undefined;
}

/** 判断库存是否可选 */
function isInventorySelectable(row: InventorySelectRow) {
  const key = getInventoryKey(row);
  return !key || !disabledInventoryKeys.value.has(key);
}

/** 合并当前页和跨页保留的选择记录 */
function mergeSelectedRows(rows: InventorySelectRow[]) {
  const selectedMap = new Map<string, InventorySelectRow>();
  rows
    .filter((row) => isInventorySelectable(row))
    .forEach((row) => selectedMap.set(getRowKey(row), row));
  return [...selectedMap.values()];
}

/** 获取 VXE 当前页和 reserve 中的完整选择 */
function getSelectedRows() {
  const records =
    (gridApi.grid.getCheckboxRecords?.() as InventorySelectRow[] | undefined) ||
    [];
  const reserves =
    (gridApi.grid.getCheckboxReserveRecords?.() as
      | InventorySelectRow[]
      | undefined) || [];
  return mergeSelectedRows([...reserves, ...records]);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useInventorySelectGridFormSchema(),
  },
  gridOptions: {
    columns: useInventorySelectGridColumns(),
    height: 560,
    keepSource: true,
    showOverflow: false,
    checkboxConfig: {
      checkMethod: ({ row }: { row: InventorySelectRow }) =>
        isInventorySelectable(row),
      highlight: true,
      range: true,
      reserve: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const data = await getInventoryPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            type: 'warehouse',
            warehouseId: props.warehouseId,
            onlyPositiveQuantity: true,
            ...formValues,
          });
          return {
            ...data,
            list: (data.list || []).map((inventory) => ({
              ...inventory,
              availableQuantity: inventory.quantity,
            })),
          };
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
  } as VxeTableGridOptions<InventorySelectRow>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
  },
});

async function openModal(selectedInventoryKeys: string[] = []) {
  if (!props.warehouseId) {
    message.warning('请先选择仓库');
    return;
  }
  open.value = true;
  disabledInventoryKeys.value = new Set(selectedInventoryKeys);
  await nextTick();
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  await gridApi.formApi.resetForm();
  await gridApi.query();
}

async function closeModal() {
  open.value = false;
  disabledInventoryKeys.value = new Set();
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
}

function confirmSelectedRows(rows: InventorySelectRow[]) {
  const selectedList = mergeSelectedRows(rows);
  if (selectedList.length === 0) {
    message.warning('请选择库存');
    return;
  }
  emit('change', selectedList);
  closeModal();
}

function handleConfirm() {
  confirmSelectedRows(getSelectedRows());
}

/** 双击行直接选择并确认 */
function handleCellDblclick({ row }: CellDblclickEvent) {
  if (!isInventorySelectable(row)) {
    message.warning('该库存已添加');
    return;
  }
  confirmSelectedRows(mergeSelectedRows([...getSelectedRows(), row]));
}

defineExpose({ open: openModal });
</script>

<template>
  <Modal
    v-model:open="open"
    title="库存选择"
    width="80%"
    :destroy-on-close="true"
    @ok="handleConfirm"
    @cancel="closeModal"
  >
    <Grid table-title="库存列表">
      <template #itemInfo="{ row }">
        <div class="flex flex-col gap-1 py-1 leading-5">
          <div>{{ row.itemName || '-' }}</div>
          <div v-if="row.itemCode" class="text-xs text-gray-500">
            商品编号：{{ row.itemCode }}
          </div>
        </div>
      </template>
      <template #skuInfo="{ row }">
        <div class="flex flex-col gap-1 py-1 leading-5">
          <div>{{ row.skuName || '-' }}</div>
          <div v-if="row.skuCode" class="text-xs text-gray-500">
            规格编号：{{ row.skuCode }}
          </div>
        </div>
      </template>
      <template #availableQuantity="{ row }">
        {{ formatQuantity(row.availableQuantity) }}
      </template>
    </Grid>
  </Modal>
</template>
