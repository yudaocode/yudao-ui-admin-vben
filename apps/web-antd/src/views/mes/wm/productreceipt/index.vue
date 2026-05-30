<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmProductReceiptApi } from '#/api/mes/wm/productreceipt';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmProductReceiptStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelProductReceipt,
  deleteProductReceipt,
  exportProductReceipt,
  getProductReceiptPage,
} from '#/api/mes/wm/productreceipt';
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

/** 创建产品入库单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看产品入库单 */
function handleDetail(row: MesWmProductReceiptApi.ProductReceipt) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑产品入库单 */
function handleEdit(row: MesWmProductReceiptApi.ProductReceipt) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行上架 */
function handleStock(row: MesWmProductReceiptApi.ProductReceipt) {
  formModalApi.setData({ formType: 'stock', id: row.id }).open();
}

/** 执行入库 */
function handleFinish(row: MesWmProductReceiptApi.ProductReceipt) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除产品入库单 */
async function handleDelete(row: MesWmProductReceiptApi.ProductReceipt) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteProductReceipt(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消产品入库单 */
async function handleCancel(row: MesWmProductReceiptApi.ProductReceipt) {
  await cancelProductReceipt(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportProductReceipt(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '产品入库单.xls', source: data });
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
          return await getProductReceiptPage({
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
  } as VxeTableGridOptions<MesWmProductReceiptApi.ProductReceipt>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】产品产出、产品入库"
        url="https://doc.iocoder.cn/mes/wm/product-in/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="产品入库单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['产品入库单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-product-receipt:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-product-receipt:export'],
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
              auth: ['mes:wm-product-receipt:update'],
              ifShow: row.status === MesWmProductReceiptStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-product-receipt:delete'],
              ifShow: row.status === MesWmProductReceiptStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行上架',
              type: 'link',
              auth: ['mes:wm-product-receipt:update'],
              ifShow: row.status === MesWmProductReceiptStatusEnum.APPROVING,
              onClick: handleStock.bind(null, row),
            },
            {
              label: '执行入库',
              type: 'link',
              auth: ['mes:wm-product-receipt:finish'],
              ifShow: row.status === MesWmProductReceiptStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:wm-product-receipt:update'],
              ifShow:
                row.status === MesWmProductReceiptStatusEnum.APPROVING ||
                row.status === MesWmProductReceiptStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该产品入库单？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
