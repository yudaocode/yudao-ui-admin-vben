<script lang="ts" setup>
import type { InventoryDimension } from './data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsInventoryApi } from '#/api/wms/inventory';

import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { Checkbox } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getInventoryPage } from '#/api/wms/inventory';
import { formatQuantity } from '#/views/wms/utils/format';

import { INVENTORY_DIMENSION, useGridColumns, useGridFormSchema } from './data';

interface InventoryRow extends WmsInventoryApi.Inventory {
  skuWarehouseId?: string;
  warehouseItemId?: string;
}

defineOptions({ name: 'WmsInventory' });

const currentRows = ref<InventoryRow[]>([]);
const currentDimension = ref<InventoryDimension>(INVENTORY_DIMENSION.WAREHOUSE);
const filterZero = ref(false);

/** 补充合并单元格需要的复合 key */
function buildRows(items: WmsInventoryApi.Inventory[]) {
  return items.map((item) => ({
    ...item,
    skuWarehouseId: `${item.skuId || 0}-${item.warehouseId || 0}`,
    warehouseItemId: `${item.warehouseId || 0}-${item.itemId || 0}`,
  }));
}

/** 切换统计维度时同步表单、表头和查询参数 */
async function handleDimensionChange(dimension: InventoryDimension) {
  // spanMethod 依赖当前维度判断合并字段，先更新本地状态。
  currentDimension.value = dimension;
  // 表头结构需要立即跟随维度切换，避免请求完成前仍显示旧列。
  await gridApi.grid.reloadColumn(useGridColumns(dimension) || []);
  // VXE proxy 查询会合并最近提交值，这里显式写入新 type 并刷新提交快照。
  await gridApi.formApi.setFieldValue('type', dimension);
  const formValues = await gridApi.formApi.getValues();
  gridApi.formApi.setLatestSubmissionValues(formValues);
  // 带上最新表单值重新加载，确保本次请求使用切换后的统计维度。
  await gridApi.reload(formValues);
}

/** 切换零库存过滤时按当前搜索条件重新查询 */
function handleFilterZeroChange() {
  gridApi.query();
}

/** 按列字段读取行值，兼容 VXE 的 field/property */
function getRowPropertyValue(row: InventoryRow | undefined, property: string) {
  return row?.[property as keyof InventoryRow];
}

/** 根据统计维度返回需要合并单元格的字段 */
function getRowSpanProperties() {
  if (currentDimension.value === INVENTORY_DIMENSION.ITEM) {
    return ['itemId', 'skuId', 'skuWarehouseId'];
  }
  return ['warehouseId', 'warehouseItemId'];
}

/** 合并库存统计的维度单元格 */
function handleSpanMethod({
  column,
  rowIndex,
}: {
  column: { field?: string; property?: string };
  rowIndex: number;
}) {
  const property = column.field || column.property;
  if (!property || !getRowSpanProperties().includes(property)) {
    return { colspan: 1, rowspan: 1 };
  }
  const row = currentRows.value[rowIndex];
  if (
    rowIndex > 0 &&
    getRowPropertyValue(currentRows.value[rowIndex - 1], property) ===
      getRowPropertyValue(row, property)
  ) {
    return { colspan: 0, rowspan: 0 };
  }
  let rowspan = 1;
  for (let index = rowIndex + 1; index < currentRows.value.length; index += 1) {
    if (
      getRowPropertyValue(currentRows.value[index], property) !==
      getRowPropertyValue(row, property)
    ) {
      break;
    }
    rowspan += 1;
  }
  return { colspan: 1, rowspan };
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(handleDimensionChange),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          // 维度切换会通过 reload(formValues) 传入新 type，刷新场景用当前维度兜底。
          const nextDimension = (formValues.type ||
            currentDimension.value ||
            INVENTORY_DIMENSION.WAREHOUSE) as InventoryDimension;
          currentDimension.value = nextDimension;
          await gridApi.grid.reloadColumn(useGridColumns(nextDimension) || []);

          // type 是后端聚合维度参数，普通搜索参数里移除，避免重复透传旧值。
          const queryParams = { ...formValues };
          Reflect.deleteProperty(queryParams, 'type');
          const data = await getInventoryPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...queryParams,
            type: nextDimension,
            onlyPositiveQuantity: filterZero.value ? true : undefined,
          });

          // spanMethod 依赖当前页数据计算 rowspan，需要保存构造后的行。
          currentRows.value = buildRows(data.list || []);
          return {
            ...data,
            list: currentRows.value,
          };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    spanMethod: handleSpanMethod,
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<InventoryRow>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【库存】库存记录、流水、统计"
        url="https://doc.iocoder.cn/wms/inventory/"
      />
    </template>

    <Grid table-title="库存统计">
      <template #toolbar-tools>
        <Checkbox v-model:checked="filterZero" @change="handleFilterZeroChange">
          过滤掉库存为 0 的商品
        </Checkbox>
      </template>
      <template #warehouseName="{ row }">
        {{ row.warehouseName || '-' }}
      </template>
      <template #itemInfo="{ row }">
        <div>{{ row.itemName || '-' }}</div>
        <div v-if="row.itemCode" class="text-xs text-gray-500">
          商品编号：{{ row.itemCode }}
        </div>
      </template>
      <template #skuInfo="{ row }">
        <div>{{ row.skuName || '-' }}</div>
        <div v-if="row.skuCode" class="text-xs text-gray-500">
          规格编号：{{ row.skuCode }}
        </div>
      </template>
      <template #quantity="{ row }">
        {{ formatQuantity(row.quantity) }}
      </template>
    </Grid>
  </Page>
</template>
