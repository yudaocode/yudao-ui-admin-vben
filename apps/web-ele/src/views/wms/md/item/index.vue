<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsItemApi } from '#/api/wms/md/item';
import type { WmsItemSkuApi } from '#/api/wms/md/item/sku';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElCard, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteItem, exportItem, getItemPage } from '#/api/wms/md/item';
import { $t } from '#/locales';
import { WmsItemCategoryTree } from '#/views/wms/md/item/category/components';
import {
  formatDimensionText,
  formatPrice,
  formatWeight,
} from '#/views/wms/utils/format';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

type ItemSkuRow = WmsItemSkuApi.ItemSku;

defineOptions({ name: 'WmsItem' });

const currentRows = ref<ItemSkuRow[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 展开商品 SKU 列表 */
function buildItemSkuRows(items: WmsItemApi.Item[]) {
  return items.flatMap((item) => {
    const skus = item.skus?.length ? item.skus : [{}];
    return skus.map((sku) => ({
      ...sku,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      unit: item.unit,
      brandId: item.brandId,
      brandName: item.brandName,
    }));
  });
}

/** 创建商品 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑商品 */
function handleEdit(row: ItemSkuRow) {
  formModalApi.setData({ id: row.itemId }).open();
}

/** 删除商品 */
async function handleDelete(row: ItemSkuRow) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.itemName]),
  });
  try {
    await deleteItem(row.itemId!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 导出商品 */
async function handleExport() {
  const data = await exportItem(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '商品.xls', source: data });
}

/** 分类树点击 */
const searchCategoryId = ref<number | undefined>(undefined);
function handleCategoryNodeClick(categoryId: number | undefined) {
  searchCategoryId.value = categoryId;
  handleRefresh();
}

/** 合并商品维度的重复单元格 */
function handleSpanMethod({
  column,
  rowIndex,
}: {
  column: { field?: string; property?: string };
  rowIndex: number;
}) {
  const field = column.field || column.property;
  if (!['actions', 'itemInfo'].includes(field || '')) {
    return { colspan: 1, rowspan: 1 };
  }
  const row = currentRows.value[rowIndex];
  if (rowIndex > 0 && currentRows.value[rowIndex - 1]?.itemId === row?.itemId) {
    return { colspan: 0, rowspan: 0 };
  }
  let rowspan = 1;
  for (let index = rowIndex + 1; index < currentRows.value.length; index += 1) {
    if (currentRows.value[index]?.itemId !== row?.itemId) {
      break;
    }
    rowspan += 1;
  }
  return { colspan: 1, rowspan };
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    showOverflow: false,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const data = await getItemPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            categoryId: searchCategoryId.value,
          });
          currentRows.value = buildItemSkuRows(data.list || []);
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
  } as VxeTableGridOptions<ItemSkuRow>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【基础】商品、SKU、分类、品牌"
        url="https://doc.iocoder.cn/wms/md/item/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <div class="flex h-full w-full">
      <ElCard class="mr-4 h-full w-1/6">
        <WmsItemCategoryTree @node-click="handleCategoryNodeClick" />
      </ElCard>
      <div class="w-5/6">
        <Grid table-title="商品列表">
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: $t('ui.actionTitle.create', ['商品']),
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['wms:item:create'],
                  onClick: handleCreate,
                },
                {
                  label: $t('ui.actionTitle.export'),
                  type: 'primary',
                  icon: ACTION_ICON.DOWNLOAD,
                  auth: ['wms:item:export'],
                  onClick: handleExport,
                },
              ]"
            />
          </template>
          <template #itemInfo="{ row }">
            <div class="flex flex-col gap-1 py-1 leading-5">
              <div class="text-sm">{{ row.itemName || '-' }}</div>
              <div v-if="row.itemCode" class="text-xs text-gray-500">
                {{ row.itemCode }}
              </div>
              <div v-if="row.brandName" class="text-xs text-gray-500">
                品牌：{{ row.brandName }}
              </div>
              <div v-if="row.categoryName" class="text-xs text-gray-500">
                分类：{{ row.categoryName }}
              </div>
            </div>
          </template>
          <template #skuInfo="{ row }">
            <div class="flex flex-col gap-1 py-1 leading-5">
              <div class="text-sm">{{ row.name || '-' }}</div>
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
              <div v-if="hasValue(row.costPrice)">
                成本价：{{ formatPrice(row.costPrice) }}
              </div>
              <div v-if="hasValue(row.sellingPrice)">
                销售价：{{ formatPrice(row.sellingPrice) }}
              </div>
            </div>
          </template>
          <template #weightInfo="{ row }">
            <div class="flex flex-col gap-1 py-1 leading-5">
              <div v-if="hasValue(row.netWeight)">
                净重：{{ formatWeight(row.netWeight) }}
              </div>
              <div v-if="hasValue(row.grossWeight)">
                毛重：{{ formatWeight(row.grossWeight) }}
              </div>
            </div>
          </template>
          <template #dimensionInfo="{ row }">
            {{ formatDimensionText(row.length, row.width, row.height) || '-' }}
          </template>
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: $t('common.edit'),
                  type: 'primary',
                  link: true,
                  icon: ACTION_ICON.EDIT,
                  auth: ['wms:item:update'],
                  onClick: handleEdit.bind(null, row),
                },
                {
                  label: $t('common.delete'),
                  type: 'danger',
                  link: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['wms:item:delete'],
                  popConfirm: {
                    title: `确认删除商品【${row.itemName}】吗？`,
                    confirm: handleDelete.bind(null, row),
                  },
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
