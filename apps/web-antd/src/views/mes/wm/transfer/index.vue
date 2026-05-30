<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmTransferApi } from '#/api/mes/wm/transfer';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmTransferStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelTransfer,
  deleteTransfer,
  exportTransfer,
  getTransferPage,
} from '#/api/mes/wm/transfer';
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

/** 创建转移单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看转移单详情 */
function handleDetail(row: MesWmTransferApi.Transfer) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑转移单 */
function handleEdit(row: MesWmTransferApi.Transfer) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 到货确认 */
function handleConfirm(row: MesWmTransferApi.Transfer) {
  formModalApi.setData({ formType: 'confirm', id: row.id }).open();
}

/** 执行上架 */
function handleStock(row: MesWmTransferApi.Transfer) {
  formModalApi.setData({ formType: 'stock', id: row.id }).open();
}

/** 执行转移 */
function handleFinish(row: MesWmTransferApi.Transfer) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除转移单 */
async function handleDelete(row: MesWmTransferApi.Transfer) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteTransfer(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消转移单 */
async function handleCancel(row: MesWmTransferApi.Transfer) {
  await cancelTransfer(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportTransfer(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '转移单.xls', source: data });
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
          return await getTransferPage({
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
  } as VxeTableGridOptions<MesWmTransferApi.Transfer>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】调拨单、装箱管理"
        url="https://doc.iocoder.cn/mes/wm/transfer/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="转移单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['转移单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-transfer:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-transfer:export'],
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
              auth: ['mes:wm-transfer:update'],
              ifShow: row.status === MesWmTransferStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-transfer:delete'],
              ifShow: row.status === MesWmTransferStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '到货确认',
              type: 'link',
              auth: ['mes:wm-transfer:update'],
              ifShow: row.status === MesWmTransferStatusEnum.UNCONFIRMED,
              onClick: handleConfirm.bind(null, row),
            },
            {
              label: '执行上架',
              type: 'link',
              auth: ['mes:wm-transfer:update'],
              ifShow: row.status === MesWmTransferStatusEnum.APPROVING,
              onClick: handleStock.bind(null, row),
            },
            {
              label: '执行转移',
              type: 'link',
              auth: ['mes:wm-transfer:finish'],
              ifShow: row.status === MesWmTransferStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:wm-transfer:update'],
              ifShow:
                row.status === MesWmTransferStatusEnum.UNCONFIRMED ||
                row.status === MesWmTransferStatusEnum.APPROVING ||
                row.status === MesWmTransferStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该转移单？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
