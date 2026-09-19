<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaSupplyItemApi } from '#/api/oa/supply/item';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';

import { ElLoading, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSupplyItem,
  getSupplyItemPage,
} from '#/api/oa/supply/item';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import StockForm from './modules/stock-form.vue';

defineOptions({ name: 'OaSupplyItem' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [StockFormModal, stockFormModalApi] = useVbenModal({
  connectedComponent: StockForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建办公用品 */
async function handleCreate() {
  // 新增时，默认带入当前筛选的类别
  const formValues = await gridApi.formApi.getValues();
  formModalApi.setData({ category: formValues.category }).open();
}

/** 编辑办公用品 */
function handleEdit(row: OaSupplyItemApi.SupplyItem) {
  formModalApi.setData(row).open();
}

/** 办公用品入库 */
function handleStockIn(row: OaSupplyItemApi.SupplyItem) {
  stockFormModalApi.setData(row).open();
}

/** 删除办公用品 */
async function handleDelete(row: OaSupplyItemApi.SupplyItem) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
  });
  try {
    await deleteSupplyItem(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSupplyItemPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaSupplyItemApi.SupplyItem>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="【行政】办公用品、用印管理" url="https://doc.iocoder.cn/oa/administration/supply-seal/" />
    <FormModal @success="handleRefresh" />
    <StockFormModal @success="handleRefresh" />

    <Grid table-title="办公用品列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['办公用品']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:supply-item:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #stockQuantity="{ row }">
        <span
          :class="
            row.minStockQuantity! > 0 &&
            row.stockQuantity! < row.minStockQuantity!
              ? 'text-red-500'
              : ''
          "
        >
          {{ row.stockQuantity }}
        </span>
      </template>
      <template #statusTag="{ row }">
        <ElTag
          :type="
            row.status === CommonStatusEnum.ENABLE ? 'success' : 'danger'
          "
        >
          {{ row.status === CommonStatusEnum.ENABLE ? '正常' : '停用' }}
        </ElTag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['oa:supply-item:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '入库',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.ADD,
              auth: ['oa:supply-item:stock-in'],
              onClick: handleStockIn.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:supply-item:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
