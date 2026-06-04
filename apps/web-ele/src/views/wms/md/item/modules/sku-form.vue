<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsItemSkuApi } from '#/api/wms/md/item/sku';

import { nextTick, ref } from 'vue';

import { generateWmsCode } from '@vben/constants';

import { ElButton, ElInput, ElInputNumber, ElMessage } from 'element-plus';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  DIMENSION_PRECISION,
  PRICE_PRECISION,
  WEIGHT_PRECISION,
} from '#/views/wms/utils/format';

interface SkuRow extends WmsItemSkuApi.ItemSku {
  seq: number;
}

let skuSeq = 0; // SKU 行可能还没有后端 id，使用本地序号作为 VXE 行操作的稳定标识
const tableData = ref<SkuRow[]>([]);

function nextSkuSeq() {
  skuSeq += 1;
  return skuSeq;
}

function buildEmptySku(): SkuRow {
  return {
    seq: nextSkuSeq(),
    id: undefined,
    name: undefined,
    barCode: undefined,
    code: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    grossWeight: undefined,
    netWeight: undefined,
    costPrice: undefined,
    sellingPrice: undefined,
  };
}

function toSkuRow(sku: WmsItemSkuApi.ItemSku): SkuRow {
  return {
    ...sku,
    seq: nextSkuSeq(),
  };
}

function toSku(row: SkuRow): WmsItemSkuApi.ItemSku {
  const { seq: _seq, ...sku } = row;
  return sku;
}

async function reloadGrid() {
  await nextTick();
  await gridApi.grid.reloadData(tableData.value);
}

async function setRows(skus?: WmsItemSkuApi.ItemSku[]) {
  skuSeq = 0;
  tableData.value = skus?.length
    ? skus.map((sku) => toSkuRow(sku))
    : [buildEmptySku()];
  await reloadGrid();
}

function getRows() {
  return tableData.value.map((row) => toSku(row));
}

function validate() {
  if (tableData.value.length === 0) {
    throw new Error('至少包含一个商品规格');
  }
  for (let index = 0; index < tableData.value.length; index += 1) {
    const row = tableData.value[index];
    if (!row?.name) {
      throw new Error(`第 ${index + 1} 行：规格名称不能为空`);
    }
  }
}

async function handleAddSku() {
  tableData.value.push(buildEmptySku());
  await reloadGrid();
}

async function handleDeleteSku(row: SkuRow) {
  if (tableData.value.length <= 1) {
    ElMessage.error('至少包含一个商品规格');
    return;
  }
  const index = tableData.value.findIndex((item) => item.seq === row.seq);
  if (index !== -1) {
    tableData.value.splice(index, 1);
  }
  await reloadGrid();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'name',
        title: '规格名称',
        minWidth: 180,
        slots: { default: 'name' },
      },
      {
        field: 'codeBarCode',
        title: '编号/条码',
        width: 300,
        slots: { default: 'codeBarCode' },
      },
      {
        field: 'dimension',
        title: '长/宽/高(cm)',
        width: 300,
        slots: { default: 'dimension' },
      },
      {
        field: 'weight',
        title: '净重/毛重(kg)',
        width: 200,
        slots: { default: 'weight' },
      },
      {
        field: 'price',
        title: '成本价/销售价',
        width: 200,
        slots: { default: 'price' },
      },
      {
        field: 'actions',
        title: '操作',
        align: 'center',
        width: 80,
        slots: { default: 'actions' },
      },
    ],
    data: tableData.value,
    minHeight: 260,
    autoResize: true,
    border: true,
    showOverflow: false,
    rowConfig: {
      keyField: 'seq',
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<SkuRow>,
});

defineExpose({
  getRows,
  setRows,
  validate,
});
</script>

<template>
  <div>
    <div class="mb-3 flex items-center justify-between">
      <span class="text-sm font-semibold">规格</span>
      <TableAction
        :actions="[
          {
            label: '新增规格',
            type: 'primary',
            onClick: handleAddSku,
          },
        ]"
      />
    </div>
    <Grid class="w-full">
      <template #name="{ row }">
        <ElInput
          v-model="row.name"
          class="w-full"
          maxlength="255"
          placeholder="请输入规格名称"
        />
      </template>
      <template #codeBarCode="{ row }">
        <div class="flex flex-col gap-2 py-1">
          <ElInput
            v-model="row.code"
            class="w-full"
            maxlength="64"
            placeholder="编号"
          >
            <template #append>
              <ElButton @click="row.code = generateWmsCode('S')">生成</ElButton>
            </template>
          </ElInput>
          <ElInput
            v-model="row.barCode"
            class="w-full"
            maxlength="64"
            placeholder="条码"
          >
            <template #append>
              <ElButton @click="row.barCode = generateWmsCode()">
                生成
              </ElButton>
            </template>
          </ElInput>
        </div>
      </template>
      <template #dimension="{ row }">
        <div class="flex w-full gap-1">
          <ElInputNumber
            v-model="row.length"
            :controls="false"
            :min="0"
            :precision="DIMENSION_PRECISION"
            class="!w-1/3"
            placeholder="长"
          />
          <ElInputNumber
            v-model="row.width"
            :controls="false"
            :min="0"
            :precision="DIMENSION_PRECISION"
            class="!w-1/3"
            placeholder="宽"
          />
          <ElInputNumber
            v-model="row.height"
            :controls="false"
            :min="0"
            :precision="DIMENSION_PRECISION"
            class="!w-1/3"
            placeholder="高"
          />
        </div>
      </template>
      <template #weight="{ row }">
        <div class="flex flex-col gap-2 py-1">
          <ElInputNumber
            v-model="row.netWeight"
            :controls="false"
            :min="0"
            :precision="WEIGHT_PRECISION"
            class="!w-full"
            placeholder="净重"
          />
          <ElInputNumber
            v-model="row.grossWeight"
            :controls="false"
            :min="0"
            :precision="WEIGHT_PRECISION"
            class="!w-full"
            placeholder="毛重"
          />
        </div>
      </template>
      <template #price="{ row }">
        <div class="flex flex-col gap-2 py-1">
          <ElInputNumber
            v-model="row.costPrice"
            :controls="false"
            :min="0"
            :precision="PRICE_PRECISION"
            class="!w-full"
            placeholder="成本价"
          />
          <ElInputNumber
            v-model="row.sellingPrice"
            :controls="false"
            :min="0"
            :precision="PRICE_PRECISION"
            class="!w-full"
            placeholder="销售价"
          />
        </div>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '删除',
              type: 'danger',
              link: true,
              onClick: handleDeleteSku.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
