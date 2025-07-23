<script lang="ts" setup>
import type { ErpPurchaseOrderApi } from '#/api/erp/purchase/order';

import { ref, watch } from 'vue';

import { erpPriceMultiply } from '@vben/utils';

import { Button, Input, InputNumber, Select, Table } from 'ant-design-vue';

import { getProductSimpleList } from '#/api/erp/product/product';
import { getStockCountByProductId } from '#/api/erp/stock/stock';

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  disabled: false,
});

interface Props {
  items?: ErpPurchaseOrderApi.PurchaseOrderItem[];
  disabled?: boolean;
}

const formData = ref<ErpPurchaseOrderApi.PurchaseOrderItem[]>([]);
const productList = ref<any[]>([]);

watch(
  () => props.items,
  (val) => {
    formData.value = val || [];
  },
  { immediate: true },
);

// 初始化时加载产品列表
const initProductList = async () => {
  if (productList.value.length === 0) {
    productList.value = await getProductSimpleList();
  }
};

// 组件挂载时加载产品列表
initProductList();

const onChangeProduct = async (productId: number, index: number) => {
  const product = productList.value.find((item) => item.id === productId);
  if (!product) return;

  const stockCount = await getStockCountByProductId(productId);

  const item = formData.value[index];
  if (item) {
    item.productId = productId;
    item.productUnitId = product.unitId;
    item.productBarCode = product.barCode;
    item.productUnitName = product.unitName;
    item.productName = product.name;
    item.stockCount = stockCount || 0;
    item.productPrice = product.purchasePrice;

    calculatePrice(index);
  }
};

const calculatePrice = (index: number) => {
  const item = formData.value[index];
  if (item && item.productPrice && item.count) {
    item.totalProductPrice = erpPriceMultiply(item.productPrice, item.count);
    item.taxPrice = erpPriceMultiply(
      item.totalProductPrice,
      (item.taxPercent || 0) / 100,
    );
    item.totalPrice = item.totalProductPrice + item.taxPrice;
  }
};

const onCountChange = (value: null | number, index: number) => {
  const item = formData.value[index];
  if (item) {
    item.count = value || 0;
    calculatePrice(index);
  }
};

const onPriceChange = (value: null | number, index: number) => {
  const item = formData.value[index];
  if (item) {
    item.productPrice = value || 0;
    calculatePrice(index);
  }
};

const onTaxPercentChange = (value: null | number, index: number) => {
  const item = formData.value[index];
  if (item) {
    item.taxPercent = value || 0;
    calculatePrice(index);
  }
};

const onRemarkChange = (value: string, index: number) => {
  const item = formData.value[index];
  if (item) {
    item.remark = value;
  }
};

const columns = [
  {
    title: '产品名称',
    dataIndex: 'productName',
    key: 'productName',
    width: 200,
  },
  { title: '库存', dataIndex: 'stockCount', key: 'stockCount', width: 80 },
  {
    title: '条码',
    dataIndex: 'productBarCode',
    key: 'productBarCode',
    width: 120,
  },
  {
    title: '单位',
    dataIndex: 'productUnitName',
    key: 'productUnitName',
    width: 80,
  },
  { title: '数量', dataIndex: 'count', key: 'count', width: 120 },
  {
    title: '产品单价',
    dataIndex: 'productPrice',
    key: 'productPrice',
    width: 120,
  },
  {
    title: '金额',
    dataIndex: 'totalProductPrice',
    key: 'totalProductPrice',
    width: 120,
  },
  { title: '税率(%)', dataIndex: 'taxPercent', key: 'taxPercent', width: 100 },
  { title: '税额', dataIndex: 'taxPrice', key: 'taxPrice', width: 120 },
  { title: '税额合计', dataIndex: 'totalPrice', key: 'totalPrice', width: 120 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 150 },
  { title: '操作', key: 'operation', width: 120 },
];

const getSummaries = (): {
  count: number;
  productName: string;
  taxPrice: number;
  totalPrice: number;
  totalProductPrice: number;
} => {
  const sums = {
    productName: '合计',
    count: formData.value.reduce((sum, item) => sum + (item.count || 0), 0),
    totalProductPrice: formData.value.reduce(
      (sum, item) => sum + (item.totalProductPrice || 0),
      0,
    ),
    taxPrice: formData.value.reduce(
      (sum, item) => sum + (item.taxPrice || 0),
      0,
    ),
    totalPrice: formData.value.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    ),
  };
  return sums;
};

const handleAdd = async () => {
  await initProductList();

  const newItem: ErpPurchaseOrderApi.PurchaseOrderItem = {
    id: undefined,
    orderId: undefined,
    productId: undefined,
    productUnitId: undefined,
    productPrice: undefined,
    count: 1,
    totalProductPrice: 0,
    taxPercent: 0,
    taxPrice: 0,
    totalPrice: 0,
    remark: undefined,
    productName: undefined,
    productBarCode: undefined,
    productUnitName: undefined,
    stockCount: 0,
  };

  formData.value.push(newItem);
};

const handleDelete = (index: number) => {
  formData.value.splice(index, 1);
};

const validate = async (): Promise<void> => {
  for (let i = 0; i < formData.value.length; i++) {
    const item = formData.value[i];
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

const getData = (): ErpPurchaseOrderApi.PurchaseOrderItem[] => formData.value;
const init = (
  items: ErpPurchaseOrderApi.PurchaseOrderItem[] | undefined,
): void => {
  formData.value = items || [];
};

defineExpose({ validate, getData, init });
</script>

<template>
  <div>
    <div class="mb-4">
      <Button v-if="!disabled" type="primary" @click="handleAdd" class="mb-2">
        添加产品
      </Button>
    </div>

    <Table
      :columns="columns"
      :data-source="formData"
      :pagination="false"
      bordered
      size="small"
      :scroll="{ x: 1400 }"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- 产品名称 -->
        <template v-if="column.key === 'productName'">
          <Select
            v-if="!disabled"
            v-model:value="record.productId"
            placeholder="请选择产品"
            show-search
            :filter-option="false"
            @change="(value) => onChangeProduct(value, index)"
            class="w-full"
          >
            <Select.Option
              v-for="product in productList"
              :key="product.id"
              :value="product.id"
            >
              {{ product.name }}
            </Select.Option>
          </Select>
          <span v-else>{{ record.productName || '-' }}</span>
        </template>

        <!-- 数量 -->
        <template v-if="column.key === 'count'">
          <InputNumber
            v-if="!disabled"
            v-model:value="record.count"
            :min="0"
            :precision="2"
            @change="(value: number | null) => onCountChange(value, index)"
            class="w-full"
          />
          <span v-else>{{ record.count || '-' }}</span>
        </template>

        <!-- 产品单价 -->
        <template v-if="column.key === 'productPrice'">
          <InputNumber
            v-if="!disabled"
            v-model:value="record.productPrice"
            :min="0"
            :precision="2"
            @change="(value: number | null) => onPriceChange(value, index)"
            class="w-full"
          />
          <span v-else>{{ record.productPrice || '-' }}</span>
        </template>

        <!-- 税率 -->
        <template v-if="column.key === 'taxPercent'">
          <InputNumber
            v-if="!disabled"
            v-model:value="record.taxPercent"
            :min="0"
            :max="100"
            :precision="2"
            @change="(value: number | null) => onTaxPercentChange(value, index)"
            class="w-full"
          />
          <span v-else>{{ record.taxPercent || '-' }}</span>
        </template>

        <!-- 备注 -->
        <template v-if="column.key === 'remark'">
          <Input
            v-if="!disabled"
            v-model:value="record.remark"
            @change="
              (e: Event) =>
                onRemarkChange((e.target as HTMLInputElement).value, index)
            "
            class="w-full"
          />
          <span v-else>{{ record.remark || '-' }}</span>
        </template>

        <!-- 操作 -->
        <template v-if="column.key === 'operation'">
          <Button
            v-if="!disabled"
            type="link"
            danger
            size="small"
            @click="handleDelete(index)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>

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
  </div>
</template>
