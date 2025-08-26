<script lang="ts" setup>
// TODO @nehc：看看整个逻辑，和 erp 风格的主子表，能不能更统一一些；
import type { ErpPurchaseOrderApi } from '#/api/erp/purchase/order';

import { nextTick, onMounted, ref, watch } from 'vue';

import { erpPriceMultiply } from '@vben/utils';

import { Input, InputNumber, Select } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProductSimpleList } from '#/api/erp/product/product';
import { getStockCount } from '#/api/erp/stock/stock';

import { usePurchaseOrderItemTableColumns } from '../data';

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  disabled: false,
  discountPercent: 0,
});

const emit = defineEmits([
  'update:items',
  'update:discount-price',
  'update:total-price',
]);

// TODO @nehc:这种一次性的，是不是可以不定义哈？
interface Props {
  items?: ErpPurchaseOrderApi.PurchaseOrderItem[];
  disabled?: boolean;
  discountPercent?: number;
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
    // TODO @nehc：这里，是不是直接 await 下？
    gridApi.grid.reloadData(tableData.value);
  },
  {
    immediate: true,
  },
);

/** 计算 discountPrice、totalPrice 价格 */
watch(
  () => [tableData.value, props.discountPercent],
  () => {
    if (!tableData.value || tableData.value.length === 0) {
      return;
    }
    const totalPrice = tableData.value.reduce(
      (prev, curr) => prev + (curr.totalPrice || 0),
      0,
    );
    const discountPrice =
      props.discountPercent === null
        ? 0
        : erpPriceMultiply(totalPrice, props.discountPercent / 100);
    const finalTotalPrice = totalPrice - discountPrice!;

    // 发送计算结果给父组件
    emit('update:discount-price', discountPrice);
    emit('update:total-price', finalTotalPrice);
  },
  { deep: true },
);

/** 初始化 */
onMounted(async () => {
  productOptions.value = await getProductSimpleList();
});

function handleAdd() {
  const newRow = {
    productId: undefined,
    productName: '',
    productUnitId: undefined,
    productUnitName: '',
    productBarCode: '',
    count: 1,
    productPrice: 0,
    totalProductPrice: 0,
    taxPercent: 0,
    taxPrice: 0,
    totalPrice: 0,
    stockCount: 0,
    remark: '',
  };
  // TODO @nehc：这里的红色告警哈？
  tableData.value.push(newRow);
  gridApi.grid.insertAt(newRow, -1);
  emit('update:items', [...tableData.value]);
}

function handleDelete(row: ErpPurchaseOrderApi.PurchaseOrderItem) {
  gridApi.grid.remove(row);
  const index = tableData.value.findIndex((item) => item.id === row.id);
  if (index !== -1) {
    tableData.value.splice(index, 1);
  }
  emit('update:items', [...tableData.value]);
}

async function handleProductChange(productId: any, row: any) {
  const product = productOptions.value.find((p) => p.id === productId);
  if (!product) {
    return;
  }

  const stockCount = await getStockCount(productId);

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
  return {
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
};

const validate = async (): Promise<boolean> => {
  try {
    for (let i = 0; i < tableData.value.length; i++) {
      const item = tableData.value[i];
      if (item) {
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
    }
    return true;
  } catch (error) {
    console.error('验证失败:', error);
    throw error;
  }
};

const getData = (): ErpPurchaseOrderApi.PurchaseOrderItem[] => tableData.value;
const init = (
  items: ErpPurchaseOrderApi.PurchaseOrderItem[] | undefined,
): void => {
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
