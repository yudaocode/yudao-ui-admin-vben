<script lang="ts" setup>
import type { ErpPurchaseOrderApi } from '#/api/erp/purchase/order';

import { nextTick, onMounted, ref, watch } from 'vue';

import { erpPriceMultiply } from '@vben/utils';

import { Input, InputNumber, Select } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProductSimpleList } from '#/api/erp/product/product';
import { getStockCountByProductId } from '#/api/erp/stock/stock';

import { usePurchaseOrderItemTableColumns } from '../data';

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  disabled: false,
});

const emit = defineEmits(['update:items']);

interface Props {
  items?: ErpPurchaseOrderApi.PurchaseOrderItem[];
  disabled?: boolean;
}

const tableData = ref<ErpPurchaseOrderApi.PurchaseOrderItem[]>([]);
const productOptions = ref<any[]>([]);

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    editConfig: {
      trigger: 'click',
      mode: 'cell',
    },
    columns: usePurchaseOrderItemTableColumns(),
    data: tableData.value,
    border: true,
    showOverflow: true,
    autoResize: true,
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
    tableData.value = items;
    gridApi.grid.reloadData(tableData.value);
  },
  {
    immediate: true,
  },
);

/** 初始化 */
onMounted(async () => {
  productOptions.value = await getProductSimpleList();
});

function handleAdd() {
  gridApi.grid.insertAt(null, -1);
}

function handleDelete(row: ErpPurchaseOrderApi.PurchaseOrderItem) {
  gridApi.grid.remove(row);
}

async function handleProductChange(productId: any, row: any) {
  const product = productOptions.value.find((p) => p.id === productId);
  if (!product) {
    return;
  }

  const stockCount = await getStockCountByProductId(productId);

  row.productId = productId;
  row.productUnitId = product.unitId;
  row.productBarCode = product.barCode;
  row.productUnitName = product.unitName;
  row.productName = product.name;
  row.stockCount = stockCount || 0;
  row.productPrice = product.purchasePrice;
  row.count = row.count || 1;

  handlePriceChange(row);
}

function handlePriceChange(row: any) {
  if (row.productPrice && row.count) {
    row.totalProductPrice = erpPriceMultiply(row.productPrice, row.count) ?? 0;
    row.taxPrice =
      erpPriceMultiply(row.totalProductPrice, (row.taxPercent || 0) / 100) ?? 0;
    row.totalPrice = row.totalProductPrice + row.taxPrice;
  }
  handleUpdateValue(row);
}

function handleUpdateValue(row: any) {
  const index = tableData.value.findIndex((item) => item.id === row.id);
  if (index === -1) {
    row.id = tableData.value.length + 1;
    tableData.value.push(row);
  } else {
    tableData.value[index] = row;
  }
  emit('update:items', tableData.value);
}

const getSummaries = (): {
  count: number;
  productName: string;
  taxPrice: number;
  totalPrice: number;
  totalProductPrice: number;
} => {
  const sums = {
    productName: '合计',
    count: tableData.value.reduce((sum, item) => sum + (item.count || 0), 0),
    totalProductPrice: tableData.value.reduce(
      (sum, item) => sum + (item.totalProductPrice || 0),
      0,
    ),
    taxPrice: tableData.value.reduce(
      (sum, item) => sum + (item.taxPrice || 0),
      0,
    ),
    totalPrice: tableData.value.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    ),
  };
  return sums;
};

const validate = async (): Promise<void> => {
  for (let i = 0; i < tableData.value.length; i++) {
    const item = tableData.value[i];
    if (!item.productId) {
      throw new Error(`第 ${i + 1} 行：产品不能为空`);
    }
    if (!item.count || item.count <= 0) {
      throw new Error(`第 ${i + 1} 行：产品数量不能为空`);
    }
    if (!item.productPrice || item.productPrice <= 0) {
      throw new Error(`第 ${i + 1} 行：产品单价不能为空`);
    }
  }
};

const getData = (): ErpPurchaseOrderApi.PurchaseOrderItem[] => tableData.value;
const init = (
  items: ErpPurchaseOrderApi.PurchaseOrderItem[] | undefined,
): void => {
  tableData.value = items || [];
  gridApi.grid.reloadData(tableData.value);
};

defineExpose({ validate, getData, init });
</script>

<template>
  <Grid class="w-full">
    <template #productId="{ row }">
      <Select
        v-if="!disabled"
        v-model:value="row.productId"
        :options="productOptions"
        :field-names="{ label: 'name', value: 'id' }"
        style="width: 100%"
        placeholder="请选择产品"
        show-search
        @change="handleProductChange($event, row)"
      />
      <span v-else>{{ row.productName || '-' }}</span>
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
        v-if="!disabled"
        v-model:value="row.productPrice"
        :min="0"
        :precision="2"
        @change="handlePriceChange(row)"
      />
      <span v-else>{{ row.productPrice || '-' }}</span>
    </template>

    <template #taxPercent="{ row }">
      <InputNumber
        v-if="!disabled"
        v-model:value="row.taxPercent"
        :min="0"
        :max="100"
        :precision="2"
        @change="handlePriceChange(row)"
      />
      <span v-else>{{ row.taxPercent || '-' }}</span>
    </template>

    <template #remark="{ row }">
      <Input v-if="!disabled" v-model:value="row.remark" class="w-full" />
      <span v-else>{{ row.remark || '-' }}</span>
    </template>

    <template #bottom>
      <!-- 合计行 -->
      <div class="mt-2 border bg-gray-50 p-2">
        <div class="flex justify-between text-sm">
          <span class="font-medium">合计：</span>
          <div class="flex space-x-4">
            <span>数量：{{ getSummaries().count }}</span>
            <span>金额：{{ getSummaries().totalProductPrice }}</span>
            <span>税额：{{ getSummaries().taxPrice }}</span>
            <span>税额合计：{{ getSummaries().totalPrice }}</span>
          </div>
        </div>
      </div>

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
  </Grid>
</template>
