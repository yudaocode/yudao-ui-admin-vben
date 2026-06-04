<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsItemSkuApi } from '#/api/wms/md/item/sku';

import { nextTick, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getItemSkuPage } from '#/api/wms/md/item/sku';
import {
  formatDimensionText,
  formatPrice,
  formatWeight,
} from '#/views/wms/utils/format';

import {
  useSkuSelectGridColumns,
  useSkuSelectGridFormSchema,
} from '../../data';

defineOptions({ name: 'WmsItemSkuSelect' });

const emit = defineEmits<{
  change: [list: WmsItemSkuApi.ItemSku[]];
}>();

const open = ref(false);
const multiple = ref(true);
const syncingSingleSelection = ref(false);
const selectedRows = ref<WmsItemSkuApi.ItemSku[]>([]);
const disabledSelectedIds = ref<Set<number>>(new Set());

/** 判断 SKU 是否可勾选，已传入的业务明细 SKU 需要禁选 */
function isRowSelectable({ row }: { row: WmsItemSkuApi.ItemSku }) {
  return row.id === undefined || !disabledSelectedIds.value.has(row.id);
}

/** 单选模式下同步 VXE 勾选状态，避免跨页残留多选 */
async function syncSingleSelection(row?: WmsItemSkuApi.ItemSku) {
  syncingSingleSelection.value = true;
  await nextTick();
  await gridApi.grid.clearCheckboxRow();
  if (row) {
    await gridApi.grid.setCheckboxRow(row, true);
  }
  await nextTick();
  syncingSingleSelection.value = false;
}

/** 处理勾选变化，单选模式只保留最后一条可选 SKU */
async function handleCheckboxChange({
  checked,
  records,
  row,
}: {
  checked: boolean;
  records: WmsItemSkuApi.ItemSku[];
  row?: WmsItemSkuApi.ItemSku;
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
  selectedRows.value = records.filter(
    (item) => item.id === undefined || !disabledSelectedIds.value.has(item.id),
  );
}

/** 处理全选变化，过滤掉已禁选的 SKU */
function handleCheckboxAll({ records }: { records: WmsItemSkuApi.ItemSku[] }) {
  if (syncingSingleSelection.value) {
    return;
  }
  selectedRows.value = records.filter(
    (item) => item.id === undefined || !disabledSelectedIds.value.has(item.id),
  );
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSkuSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useSkuSelectGridColumns(),
    height: 560,
    keepSource: true,
    showOverflow: false,
    checkboxConfig: {
      checkMethod: isRowSelectable,
      highlight: true,
      range: true,
      reserve: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getItemSkuPage({
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
  } as VxeTableGridOptions<WmsItemSkuApi.ItemSku>,
  gridEvents: {
    checkboxAll: handleCheckboxAll,
    checkboxChange: handleCheckboxChange,
  },
});

/** 打开 SKU 选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean; preselectDisabled?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  selectedRows.value = [];
  disabledSelectedIds.value =
    options?.preselectDisabled === false
      ? new Set()
      : new Set(selectedIds || []);
  await nextTick();
  await gridApi.grid.clearCheckboxRow();
  await gridApi.formApi.resetForm();
  await gridApi.query();
}

/** 关闭 SKU 选择弹窗并清空临时选择 */
async function closeModal() {
  open.value = false;
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
}

/** 确认选择并返回新增的 SKU 列表 */
function handleConfirm() {
  const list = selectedRows.value.filter(
    (sku) => sku.id !== undefined && !disabledSelectedIds.value.has(sku.id),
  );
  if (list.length === 0) {
    message.warning('请至少选择一条数据');
    return;
  }
  emit('change', list);
  closeModal();
}

defineExpose({ open: openModal });
</script>

<template>
  <Modal
    v-model:open="open"
    title="商品选择"
    width="80%"
    :destroy-on-close="true"
    @ok="handleConfirm"
    @cancel="closeModal"
  >
    <Grid table-title="商品 SKU 列表">
      <template #itemInfo="{ row }">
        <div class="flex flex-col gap-1 py-1 leading-5">
          <div>{{ row.itemName || '-' }}</div>
          <div v-if="row.itemCode" class="text-xs text-gray-500">
            商品编号：{{ row.itemCode }}
          </div>
          <div v-if="row.brandName" class="text-xs text-gray-500">
            品牌：{{ row.brandName }}
          </div>
        </div>
      </template>
      <template #skuInfo="{ row }">
        <div class="flex flex-col gap-1 py-1 leading-5">
          <div>{{ row.name || '-' }}</div>
          <div v-if="row.code" class="text-xs text-gray-500">
            编号：{{ row.code }}
          </div>
          <div v-if="row.barCode" class="text-xs text-gray-500">
            条码：{{ row.barCode }}
          </div>
        </div>
      </template>
      <template #priceInfo="{ row }">
        <div class="flex flex-col gap-1 py-1 leading-5">
          <div v-if="row.costPrice !== undefined">
            成本价：{{ formatPrice(row.costPrice) }}
          </div>
          <div v-if="row.sellingPrice !== undefined">
            销售价：{{ formatPrice(row.sellingPrice) }}
          </div>
        </div>
      </template>
      <template #weightInfo="{ row }">
        <div class="flex flex-col gap-1 py-1 leading-5">
          <div v-if="row.netWeight !== undefined">
            净重：{{ formatWeight(row.netWeight) }}
          </div>
          <div v-if="row.grossWeight !== undefined">
            毛重：{{ formatWeight(row.grossWeight) }}
          </div>
        </div>
      </template>
      <template #dimensionInfo="{ row }">
        {{ formatDimensionText(row.length, row.width, row.height) || '-' }}
      </template>
    </Grid>
  </Modal>
</template>
