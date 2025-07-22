<script lang="ts" setup>
import type { PurchaseOrderApi } from '#/api/erp/purchase/order';

import { onMounted, ref, watch } from 'vue';

import {
  erpCountInputFormatter,
  erpPriceInputFormatter,
  erpPriceMultiply,
} from '@vben/utils';

import { Button, InputNumber, Select, Table, Textarea } from 'ant-design-vue';

import { getProductSimpleList } from '#/api/erp/product/product';
import { getStockCountByProductId } from '#/api/erp/stock/stock';

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  disabled: false,
});

// 计算数组总和的工具函数
const getSumValue = (values: (number | undefined)[]): number => {
  return values.reduce((sum, value) => sum + (value || 0), 0);
};

interface Props {
  items?: PurchaseOrderApi.PurchaseOrderItem[];
  disabled?: boolean;
}

const formData = ref<PurchaseOrderApi.PurchaseOrderItem[]>([]);
const productList = ref<any[]>([]);

/** 监听 props.items 变化，重新设置 formData */
watch(
  () => props.items,
  (val) => {
    formData.value = val || [];
  },
  { immediate: true },
);

/** 监听 formData 变化，计算相关价格 */
watch(
  formData,
  (val) => {
    if (!val) return;
    val.forEach((item) => {
      if (item.productPrice && item.count) {
        item.totalPrice = erpPriceMultiply(item.productPrice, item.count);
        item.taxPrice = erpPriceMultiply(
          item.totalPrice,
          (item.taxPercent || 0) / 100,
        );
        item.totalTaxPrice = item.totalPrice + item.taxPrice;
      }
    });
  },
  { deep: true },
);

/** 表格列定义 */
const columns = [
  {
    title: '产品名称',
    dataIndex: 'productId',
    key: 'productId',
    width: 200,
  },
  {
    title: '库存',
    dataIndex: 'stockCount',
    key: 'stockCount',
    width: 80,
  },
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
  {
    title: '数量',
    dataIndex: 'count',
    key: 'count',
    width: 120,
  },
  {
    title: '产品单价',
    dataIndex: 'productPrice',
    key: 'productPrice',
    width: 120,
  },
  {
    title: '金额',
    dataIndex: 'totalPrice',
    key: 'totalPrice',
    width: 120,
  },
  {
    title: '税率(%)',
    dataIndex: 'taxPercent',
    key: 'taxPercent',
    width: 100,
  },
  {
    title: '税额',
    dataIndex: 'taxPrice',
    key: 'taxPrice',
    width: 120,
  },
  {
    title: '税额合计',
    dataIndex: 'totalTaxPrice',
    key: 'totalTaxPrice',
    width: 120,
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    width: 150,
  },
  {
    title: '操作',
    key: 'operation',
    width: 80,
  },
];

/** 合计行 */
const getSummaries = () => {
  const sums: any = {};
  sums.productId = '合计';
  sums.count = getSumValue(formData.value.map((item) => item.count));
  sums.totalPrice = getSumValue(formData.value.map((item) => item.totalPrice));
  sums.taxPrice = getSumValue(formData.value.map((item) => item.taxPrice));
  sums.totalTaxPrice = getSumValue(
    formData.value.map((item) => item.totalTaxPrice),
  );
  return sums;
};

/** 新增行 */
const handleAdd = () => {
  const row = {
    id: undefined,
    productId: undefined,
    productUnitId: undefined,
    productPrice: undefined,
    count: 1,
    totalPrice: undefined,
    taxPercent: 0,
    taxPrice: 0,
    totalTaxPrice: 0,
    remark: undefined,
    // 显示字段
    productName: undefined,
    productBarCode: undefined,
    productUnitName: undefined,
    stockCount: 0,
  };
  formData.value.push(row);
};

/** 删除行 */
const handleDelete = (index: number) => {
  formData.value.splice(index, 1);
};

/** 产品变更 */
const onChangeProduct = async (productId: number, index: number) => {
  // 获得产品
  const product = productList.value.find((item) => item.id === productId);
  if (!product) {
    return;
  }
  // 设置产品信息
  formData.value[index].productUnitId = product.unitId;
  formData.value[index].productBarCode = product.barCode;
  formData.value[index].productUnitName = product.unitName;
  formData.value[index].productPrice = product.purchasePrice;
  // 加载库存
  await setStockCount(index);
};

/** 设置库存 */
const setStockCount = async (index: number) => {
  const row = formData.value[index];
  if (!row.productId) {
    row.stockCount = 0;
    return;
  }
  const stockCount = await getStockCountByProductId(row.productId);
  row.stockCount = stockCount || 0;
};

/** 表单校验 */
const validate = async () => {
  // 校验表单
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

/** 获取表单数据 */
const getData = () => {
  return formData.value;
};

/** 初始化 */
const init = (items: PurchaseOrderApi.PurchaseOrderItem[]) => {
  formData.value = items || [];
  // 如果没有数据，默认添加一行
  if (formData.value.length === 0) {
    handleAdd();
  }
};

/** 组件挂载时 */
onMounted(async () => {
  // 加载产品列表
  productList.value = await getProductSimpleList();
  // 默认添加一行
  if (formData.value.length === 0) {
    handleAdd();
  }
});

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
        <template v-if="column.dataIndex === 'productId'">
          <Select
            v-model:value="record.productId"
            placeholder="请选择产品"
            allow-clear
            show-search
            :disabled="disabled"
            @change="onChangeProduct($event, index)"
            class="w-full"
          >
            <Select.Option
              v-for="item in productList"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
            </Select.Option>
          </Select>
        </template>
        <template v-else-if="column.dataIndex === 'stockCount'">
          <span>{{ record.stockCount || 0 }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'productBarCode'">
          <span>{{ record.productBarCode }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'productUnitName'">
          <span>{{ record.productUnitName }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'count'">
          <InputNumber
            v-model:value="record.count"
            :formatter="erpCountInputFormatter"
            placeholder="请输入数量"
            :disabled="disabled"
            :min="1"
            class="w-full"
          />
        </template>
        <template v-else-if="column.dataIndex === 'productPrice'">
          <InputNumber
            v-model:value="record.productPrice"
            :formatter="erpPriceInputFormatter"
            placeholder="请输入单价"
            :disabled="disabled"
            :min="0"
            class="w-full"
          />
        </template>
        <template v-else-if="column.dataIndex === 'totalPrice'">
          <InputNumber
            v-model:value="record.totalPrice"
            :formatter="erpPriceInputFormatter"
            placeholder="金额"
            :disabled="true"
            class="w-full"
          />
        </template>
        <template v-else-if="column.dataIndex === 'taxPercent'">
          <InputNumber
            v-model:value="record.taxPercent"
            placeholder="请输入税率"
            :disabled="disabled"
            :min="0"
            :max="100"
            class="w-full"
          />
        </template>
        <template v-else-if="column.dataIndex === 'taxPrice'">
          <InputNumber
            v-model:value="record.taxPrice"
            :formatter="erpPriceInputFormatter"
            placeholder="税额"
            :disabled="true"
            class="w-full"
          />
        </template>
        <template v-else-if="column.dataIndex === 'totalTaxPrice'">
          <InputNumber
            v-model:value="record.totalTaxPrice"
            :formatter="erpPriceInputFormatter"
            placeholder="税额合计"
            :disabled="true"
            class="w-full"
          />
        </template>
        <template v-else-if="column.dataIndex === 'remark'">
          <Textarea
            v-model:value="record.remark"
            placeholder="请输入备注"
            :disabled="disabled"
            :rows="1"
          />
        </template>
        <template v-else-if="column.key === 'operation'">
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
          <span>金额：{{ getSummaries().totalPrice }}</span>
          <span>税额：{{ getSummaries().taxPrice }}</span>
          <span>税额合计：{{ getSummaries().totalTaxPrice }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
