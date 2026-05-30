<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmProductSalesApi } from '#/api/mes/wm/productsales';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmProductSalesStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelProductSales,
  deleteProductSales,
  exportProductSales,
  getProductSalesPage,
} from '#/api/mes/wm/productsales';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建销售出库单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看销售出库单 */
function handleDetail(row: MesWmProductSalesApi.ProductSales) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑销售出库单 */
function handleEdit(row: MesWmProductSalesApi.ProductSales) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行拣货 */
function handleStock(row: MesWmProductSalesApi.ProductSales) {
  formModalApi.setData({ formType: 'stock', id: row.id }).open();
}

/** 填写运单 */
function handleShipping(row: MesWmProductSalesApi.ProductSales) {
  formModalApi.setData({ formType: 'shipping', id: row.id }).open();
}

/** 执行出库 */
function handleFinish(row: MesWmProductSalesApi.ProductSales) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除销售出库单 */
async function handleDelete(row: MesWmProductSalesApi.ProductSales) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteProductSales(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消销售出库单 */
async function handleCancel(row: MesWmProductSalesApi.ProductSales) {
  await cancelProductSales(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportProductSales(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '销售出库单.xls', source: data });
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
          return await getProductSalesPage({
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
  } as VxeTableGridOptions<MesWmProductSalesApi.ProductSales>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】发货通知、销售出库、销售退货"
        url="https://doc.iocoder.cn/mes/wm/sales-out/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="销售出库单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['销售出库单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-product-sales:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-product-sales:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <Button type="link" @click="handleDetail(row)">
          {{ row.code }}
        </Button>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mes:wm-product-sales:update'],
              ifShow: row.status === MesWmProductSalesStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-product-sales:delete'],
              ifShow: row.status === MesWmProductSalesStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '拣货',
              type: 'link',
              auth: ['mes:wm-product-sales:stock'],
              ifShow: row.status === MesWmProductSalesStatusEnum.APPROVING,
              onClick: handleStock.bind(null, row),
            },
            {
              label: '填写运单',
              type: 'link',
              auth: ['mes:wm-product-sales:shipping'],
              ifShow: row.status === MesWmProductSalesStatusEnum.SHIPPING,
              onClick: handleShipping.bind(null, row),
            },
            {
              label: '执行出库',
              type: 'link',
              auth: ['mes:wm-product-sales:finish'],
              ifShow: row.status === MesWmProductSalesStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:wm-product-sales:cancel'],
              ifShow:
                row.status === MesWmProductSalesStatusEnum.CONFIRMED ||
                row.status === MesWmProductSalesStatusEnum.APPROVING ||
                row.status === MesWmProductSalesStatusEnum.SHIPPING ||
                row.status === MesWmProductSalesStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该销售出库单？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
