<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpStockCheckApi } from '#/api/erp/stock/check';

import { nextTick, onMounted, ref, watch } from 'vue';

import { erpPriceMultiply } from '@vben/utils';

import { Input, InputNumber, Select } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProductSimpleList } from '#/api/erp/product/product';
import { getStockCount } from '#/api/erp/stock/stock';
import { getWarehouseSimpleList } from '#/api/erp/stock/warehouse';

import { useStockCheckItemTableColumns } from '../data';

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  disabled: false,
});

const emit = defineEmits(['update:items']);

interface Props {
  items?: ErpStockCheckApi.StockCheckItem[];
  disabled?: boolean;
}

const tableData = ref<ErpStockCheckApi.StockCheckItem[]>([]);
const productOptions = ref<any[]>([]);
const warehouseOptions = ref<any[]>([]);
const isValidating = ref(false);

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    editConfig: {
      trigger: 'click',
      mode: 'cell',
    },
    columns: useStockCheckItemTableColumns(isValidating),
    data: tableData.value,
    border: true,
    showOverflow: true,
    autoResize: true,
    minHeight: 250,
    keepSource: true,
    rowConfig: {
      keyField: 'id',
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
    showFooter: true,
    footerCellClassName: 'stock-in-footer-cell',
    footerMethod: ({
      columns,
    }: {
      columns: VxeTableGridOptions['columns'];
    }) => {
      const footers: any[][] = [];
      const sums = getSummaries();
      const footerData: any[] = [];
      columns!.forEach((column, columnIndex: number) => {
        if (columnIndex === 0) {
          footerData.push('合计');
        } else if (column.field === 'count') {
          footerData.push(sums.count);
        } else if (column.field === 'totalPrice') {
          footerData.push(sums.totalPrice);
        } else {
          footerData.push('');
        }
      });
      footers.push(footerData);
      return footers;
    },
  },
});

/** 监听外部传入的列数据 */
watch(
  () => props.items,
  async (items) => {
    if (!items) {
      return;
    }
    await nextTick();
    tableData.value = [...items];
    await nextTick();
    gridApi.grid.reloadData(tableData.value);
  },
  {
    immediate: true,
  },
);

/** 初始化 */
onMounted(async () => {
  productOptions.value = await getProductSimpleList();
  warehouseOptions.value = await getWarehouseSimpleList();
});

function handleAdd() {
  const newRow = {
    warehouseId: undefined,
    productId: undefined,
    productName: '',
    productUnitId: undefined,
    productUnitName: '',
    productBarCode: '',
    count: 1,
    productPrice: 0,
    totalPrice: 0,
    stockCount: 0,
    remark: '',
  };
  tableData.value.push(newRow);
  gridApi.grid.insertAt(newRow, -1);
  emit('update:items', [...tableData.value]);
  // 触发表格重新渲染以更新cellClassName
  nextTick(() => {
    gridApi.grid.refreshColumn();
  });
}

function handleDelete(row: ErpStockCheckApi.StockCheckItem) {
  gridApi.grid.remove(row);
  const index = tableData.value.findIndex((item) => item.id === row.id);
  if (index !== -1) {
    tableData.value.splice(index, 1);
  }
  emit('update:items', [...tableData.value]);
}

async function handleWarehouseChange(warehouseId: any, row: any) {
  const warehouse = warehouseOptions.value.find((w) => w.id === warehouseId);
  if (!warehouse) {
    return;
  }

  row.warehouseId = warehouseId;

  // 如果已选择产品，重新获取库存
  if (row.productId) {
    const stockCount = await getStockCount(row.productId, warehouseId);
    row.stockCount = stockCount || 0;
  }

  handleUpdateValue(row);
}

async function handleProductChange(productId: any, row: any) {
  const product = productOptions.value.find((p) => p.id === productId);
  if (!product) {
    return;
  }

  // 获取库存数量
  const stockCount = row.warehouseId
    ? await getStockCount(productId, row.warehouseId)
    : await getStockCount(productId);

  row.productId = productId;
  row.productUnitId = product.unitId;
  row.productBarCode = product.barCode;
  row.productUnitName = product.unitName;
  row.productName = product.name;
  row.stockCount = stockCount || 0;
  row.actualCount = stockCount || 0;
  row.productPrice = product.purchasePrice || 0;
  row.count = 0;

  handlePriceChange(row);
}

function handlePriceChange(row: any) {
  if (row.productPrice && row.actualCount) {
    row.count = row.actualCount - row.stockCount;
    row.totalPrice = erpPriceMultiply(row.productPrice, row.count) ?? 0;
  }
  handleUpdateValue(row);
}

function handleUpdateValue(row: any) {
  const index = tableData.value.findIndex((item) => item.id === row.id);
  if (index === -1) {
    tableData.value.push(row);
  } else {
    tableData.value[index] = row;
  }
  emit('update:items', [...tableData.value]);
  // 触发表格重新渲染以更新cellClassName
  nextTick(() => {
    gridApi.grid.refreshColumn();
  });
}

const getSummaries = (): {
  count: number;
  totalPrice: number;
} => {
  return {
    count: tableData.value.reduce((sum, item) => sum + (item.count || 0), 0),
    totalPrice: tableData.value.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    ),
  };
};

/** 验证表单 */
function validate(): Promise<boolean> {
  return new Promise((resolve) => {
    isValidating.value = true;

    // 触发表格重新渲染以显示验证错误
    nextTick(() => {
      gridApi.grid.refreshColumn();
    });

    // 验证是否有产品清单
    if (!tableData.value || tableData.value.length === 0) {
      resolve(false);
      return;
    }

    // 验证每一行的必填字段
    for (const item of tableData.value) {
      if (!item.warehouseId || !item.productId || !item.actualCount) {
        resolve(false);
        return;
      }
    }

    // 验证通过，清除验证状态
    isValidating.value = false;
    nextTick(() => {
      gridApi.grid.refreshColumn();
    });

    resolve(true);
  });
}

/** 初始化表格数据 */
function init(items: ErpStockCheckApi.StockCheckItem[]) {
  tableData.value = items || [];
  gridApi.grid.reloadData(tableData.value);
}

defineExpose({
  validate,
  init,
  handleAdd,
});
</script>

<template>
  <div class="w-full">
    <div class="mb-4 flex justify-between">
      <span class="text-lg font-medium"></span>
    </div>

    <Grid>
      <template #warehouseId="{ row }">
        <Select
          v-model:value="row.warehouseId"
          :options="warehouseOptions"
          :field-names="{ label: 'name', value: 'id' }"
          placeholder="请选择仓库"
          :disabled="disabled"
          show-search
          @change="(value) => handleWarehouseChange(value, row)"
          class="w-full"
        />
      </template>

      <template #productId="{ row }">
        <Select
          v-model:value="row.productId"
          :options="productOptions"
          :field-names="{ label: 'name', value: 'id' }"
          placeholder="请选择产品"
          :disabled="disabled"
          show-search
          @change="(value) => handleProductChange(value, row)"
          class="w-full"
        />
      </template>
      <template #actualCount="{ row }">
        <InputNumber
          v-model:value="row.actualCount"
          :disabled="disabled"
          :min="0.001"
          :precision="2"
          @change="() => handlePriceChange(row)"
          class="w-full"
        />
      </template>

      <template #count="{ row }">
        <InputNumber
          v-model:value="row.count"
          :disabled="true"
          :min="0.001"
          :precision="2"
          class="w-full"
        />
      </template>

      <template #productPrice="{ row }">
        <InputNumber
          v-model:value="row.productPrice"
          :disabled="disabled"
          :min="0.01"
          :precision="2"
          @change="() => handlePriceChange(row)"
          class="w-full"
        />
      </template>

      <template #remark="{ row }">
        <Input
          v-model:value="row.remark"
          :disabled="disabled"
          placeholder="请输入备注"
        />
      </template>

      <template #actions="{ row }">
        <TableAction
          v-if="!disabled"
          :actions="[
            {
              label: '删除',
              type: 'link',
              danger: true,
              popConfirm: {
                title: '确认删除该产品吗？',
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>

      <template #bottom>
        <TableAction
          v-if="!disabled"
          class="mt-4 flex justify-center"
          :actions="[
            {
              label: '添加产品',
              type: 'default',
              onClick: handleAdd,
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>

<style scoped>
:deep(.vxe-table .vxe-footer--column.stock-in-footer-cell .vxe-cell) {
  background-color: #f5f5f5 !important;
}
</style>
