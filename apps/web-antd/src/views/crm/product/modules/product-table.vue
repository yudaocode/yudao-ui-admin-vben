<script lang="ts" setup>
import type { CrmBusinessApi } from '#/api/crm/business';
import type { CrmContractApi } from '#/api/crm/contract';
import type { CrmProductApi } from '#/api/crm/product';

import { nextTick, onMounted, ref, watch } from 'vue';

import { erpPriceMultiply } from '@vben/utils';

import { InputNumber, Select } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { BizTypeEnum } from '#/api/crm/permission';
import { getProductSimpleList } from '#/api/crm/product';

import { useProductEditTableColumns } from '../data';

const props = defineProps<{
  bizType: BizTypeEnum;
  products?:
    | CrmBusinessApi.BusinessProduct[]
    | CrmContractApi.ContractProduct[];
}>();

const emit = defineEmits(['update:products']);

const tableData = ref<any[]>([]);

function handleAdd() {
  gridApi.grid.insertAt(null, -1);
}

function handleDelete(row: CrmProductApi.Product) {
  gridApi.grid.remove(row);
}

function handleProductChange(productId: any, row: any) {
  const product = productOptions.value.find((p) => p.id === productId);
  if (!product) {
    return;
  }
  row.productUnit = product.unit;
  row.productNo = product.no;
  row.productPrice = product.price;
  row.sellingPrice = product.price;
  row.count = 0;
  row.totalPrice = 0;
  handleUpdateValue(row);
}

function handlePriceChange(row: any) {
  row.totalPrice = erpPriceMultiply(row.sellingPrice, row.count) ?? 0;
  handleUpdateValue(row);
}

function handleUpdateValue(row: any) {
  const index = tableData.value.findIndex((item) => item.id === row.id);
  if (props.bizType === BizTypeEnum.CRM_BUSINESS) {
    row.businessPrice = row.sellingPrice;
  } else if (props.bizType === BizTypeEnum.CRM_CONTRACT) {
    row.contractPrice = row.sellingPrice;
  }
  if (index === -1) {
    row.id = tableData.value.length + 1;
    tableData.value.push(row);
  } else {
    tableData.value[index] = row;
  }
  emit('update:products', [...tableData.value]);
}

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    editConfig: {
      trigger: 'click',
      mode: 'cell',
    },
    columns: useProductEditTableColumns(),
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
  () => props.products,
  async (products) => {
    if (!products) {
      return;
    }
    await nextTick();
    tableData.value = products;
    if (props.bizType === BizTypeEnum.CRM_BUSINESS) {
      tableData.value.forEach((item) => {
        item.sellingPrice = item.businessPrice;
      });
    } else if (props.bizType === BizTypeEnum.CRM_CONTRACT) {
      tableData.value.forEach((item) => {
        item.sellingPrice = item.contractPrice;
      });
    }
    gridApi.grid.reloadData(tableData.value);
  },
  {
    immediate: true,
  },
);

/** 初始化 */
const productOptions = ref<CrmProductApi.Product[]>([]);
onMounted(async () => {
  productOptions.value = await getProductSimpleList();
});
</script>

<template>
  <Grid class="w-full">
    <template #productId="{ row }">
      <Select
        v-model:value="row.productId"
        :options="productOptions"
        :field-names="{ label: 'name', value: 'id' }"
        style="width: 100%"
        @change="handleProductChange($event, row)"
      />
    </template>
    <template #sellingPrice="{ row }">
      <InputNumber
        v-model:value="row.sellingPrice"
        :min="0.001"
        :precision="2"
        @change="handlePriceChange(row)"
      />
    </template>
    <template #count="{ row }">
      <InputNumber
        v-model:value="row.count"
        :min="0.001"
        :precision="3"
        @change="handlePriceChange(row)"
      />
    </template>
    <template #bottom>
      <TableAction
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
        :actions="[
          {
            label: $t('common.delete'),
            type: 'link',
            danger: true,
            popConfirm: {
              title: $t('ui.actionMessage.deleteConfirm', [row.name]),
              confirm: handleDelete.bind(null, row),
            },
          },
        ]"
      />
    </template>
  </Grid>
</template>
