<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmItemReceiptApi } from '#/api/mes/wm/itemreceipt';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmItemReceiptStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelItemReceipt,
  deleteItemReceipt,
  exportItemReceipt,
  getItemReceiptPage,
} from '#/api/mes/wm/itemreceipt';
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

/** 创建采购入库单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看采购入库单 */
function handleDetail(row: MesWmItemReceiptApi.ItemReceipt) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑采购入库单 */
function handleEdit(row: MesWmItemReceiptApi.ItemReceipt) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行上架 */
function handleStock(row: MesWmItemReceiptApi.ItemReceipt) {
  formModalApi.setData({ formType: 'stock', id: row.id }).open();
}

/** 执行入库 */
function handleFinish(row: MesWmItemReceiptApi.ItemReceipt) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除采购入库单 */
async function handleDelete(row: MesWmItemReceiptApi.ItemReceipt) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteItemReceipt(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消采购入库单 */
async function handleCancel(row: MesWmItemReceiptApi.ItemReceipt) {
  await cancelItemReceipt(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportItemReceipt(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '采购入库单.xls', source: data });
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
          return await getItemReceiptPage({
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
  } as VxeTableGridOptions<MesWmItemReceiptApi.ItemReceipt>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】到货通知、采购入库、采购退货"
        url="https://doc.iocoder.cn/mes/wm/purchase-in/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="采购入库单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['采购入库单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-item-receipt:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-item-receipt:export'],
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
              auth: ['mes:wm-item-receipt:update'],
              ifShow: row.status === MesWmItemReceiptStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-item-receipt:delete'],
              ifShow: row.status === MesWmItemReceiptStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行上架',
              type: 'link',
              auth: ['mes:wm-item-receipt:update'],
              ifShow: row.status === MesWmItemReceiptStatusEnum.APPROVING,
              onClick: handleStock.bind(null, row),
            },
            {
              label: '执行入库',
              type: 'link',
              auth: ['mes:wm-item-receipt:finish'],
              ifShow: row.status === MesWmItemReceiptStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:wm-item-receipt:update'],
              ifShow:
                row.status === MesWmItemReceiptStatusEnum.APPROVING ||
                row.status === MesWmItemReceiptStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该采购入库单？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
