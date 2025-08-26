<script lang="ts" setup>
import type { ErpSaleOutApi } from '#/api/erp/sale/out';

import { nextTick, onMounted, ref, watch } from 'vue';

import { erpPriceMultiply } from '@vben/utils';

import { InputNumber, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProductSimpleList } from '#/api/erp/product/product';
import { getWarehouseStockCount } from '#/api/erp/stock/stock';
import { getWarehouseSimpleList } from '#/api/erp/stock/warehouse';

import { useSaleReturnItemTableColumns } from '../data';

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  disabled: false,
});

const emit = defineEmits(['update:items', 'update:totalPrice']);

interface Props {
  items?: ErpSaleOutApi.SaleOutItem[];
  disabled?: boolean;
}

const tableData = ref<ErpSaleOutApi.SaleOutItem[]>([]);
const productOptions = ref<any[]>([]);
const warehouseOptions = ref<any[]>([]);

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    editConfig: {
      trigger: 'click',
      mode: 'cell',
    },
    columns: useSaleReturnItemTableColumns(),
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

function handlePriceChange(row: any) {
  if (row.productPrice && row.count) {
    row.totalProductPrice = erpPriceMultiply(row.productPrice, row.count) ?? 0;
    row.taxPrice =
      erpPriceMultiply(row.totalProductPrice, (row.taxPercent || 0) / 100) ?? 0;
    row.totalPrice = row.totalProductPrice + row.taxPrice;
  }
  handleUpdateValue(row);
}

const handleWarehouseChange = async (row: ErpSaleOutApi.SaleOutItem) => {
  const warehouseId = row.warehouseId;
  const stockCount = await getWarehouseStockCount({
    productId: row.productId!,
    warehouseId: warehouseId!,
  });
  row.stockCount = stockCount || 0;
  handleUpdateValue(row);
};

function handleUpdateValue(row: any) {
  const index = tableData.value.findIndex((item) => item.id === row.id);
  if (index === -1) {
    tableData.value.push(row);
  } else {
    tableData.value[index] = row;
  }
  emit('update:items', [...tableData.value]);
}

const getSummaries = (): {
  count: number;
  productName: string;
  taxPrice: number;
  totalPrice: number;
  totalProductPrice: number;
} => {
  const count = tableData.value.reduce(
    (sum, item) => sum + (item.count || 0),
    0,
  );
  const totalProductPrice = tableData.value.reduce(
    (sum, item) => sum + (item.totalProductPrice || 0),
    0,
  );
  const taxPrice = tableData.value.reduce(
    (sum, item) => sum + (item.taxPrice || 0),
    0,
  );
  const totalPrice = tableData.value.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0,
  );
  return {
    productName: '合计',
    count,
    totalProductPrice,
    taxPrice,
    totalPrice,
  };
};

const validate = async (): Promise<boolean> => {
  try {
    for (let i = 0; i < tableData.value.length; i++) {
      const item = tableData.value[i];
      if (item) {
        if (!item.warehouseId) {
          throw new Error(`第 ${i + 1} 行：仓库不能为空`);
        }
        if (!item.count || item.count <= 0) {
          throw new Error(`第 ${i + 1} 行：产品数量不能为空`);
        }
      }
    }
    return true;
  } catch (error) {
    console.error('验证失败:', error);
    throw error;
  }
};

const getData = (): ErpSaleOutApi.SaleOutItem[] => tableData.value;
const init = (items: ErpSaleOutApi.SaleOutItem[] | undefined): void => {
  tableData.value =
    items && items.length > 0
      ? items.map((item) => {
          const newItem = { ...item };
          if (newItem.productPrice && newItem.count) {
            newItem.totalProductPrice =
              erpPriceMultiply(newItem.productPrice, newItem.count) ?? 0;
            newItem.taxPrice =
              erpPriceMultiply(
                newItem.totalProductPrice,
                (newItem.taxPercent || 0) / 100,
              ) ?? 0;
            newItem.totalPrice = newItem.totalProductPrice + newItem.taxPrice;
          }
          return newItem;
        })
      : [];
  nextTick(() => {
    gridApi.grid.reloadData(tableData.value);
  });
};

defineExpose({
  validate,
  getData,
  init,
});
</script>

<template>
  <Grid class="w-full">
    <template #warehouseId="{ row }">
      <Select
        v-model:value="row.warehouseId"
        :options="warehouseOptions"
        :field-names="{ label: 'name', value: 'id' }"
        placeholder="请选择仓库"
        :disabled="disabled"
        show-search
        class="w-full"
        @change="handleWarehouseChange(row)"
      />
    </template>
    <template #productId="{ row }">
      <Select
        disabled
        v-model:value="row.productId"
        :options="productOptions"
        :field-names="{ label: 'name', value: 'id' }"
        style="width: 100%"
        placeholder="请选择产品"
        show-search
      />
    </template>

    <template #count="{ row }">
      <InputNumber
        v-if="!disabled"
        v-model:value="row.count"
        :min="0"
        :precision="2"
        @change="handlePriceChange(row)"
      />
      <span v-else>{{ row.count || '-' }}</span>
    </template>
    <template #productPrice="{ row }">
      <InputNumber
        disabled
        v-model:value="row.productPrice"
        :min="0"
        :precision="2"
        @change="handlePriceChange(row)"
      />
    </template>

    <template #bottom>
      <div class="border-border bg-muted mt-2 rounded border p-2">
        <div class="text-muted-foreground flex justify-between text-sm">
          <span class="text-foreground font-medium">合计：</span>
          <div class="flex space-x-4">
            <span>数量：{{ getSummaries().count }}</span>
            <span>金额：{{ getSummaries().totalProductPrice }}</span>
            <span>税额：{{ getSummaries().taxPrice }}</span>
            <span>税额合计：{{ getSummaries().totalPrice }}</span>
          </div>
        </div>
      </div>
    </template>
  </Grid>
</template>
