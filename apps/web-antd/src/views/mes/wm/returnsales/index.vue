<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmReturnSalesApi } from '#/api/mes/wm/returnsales';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmReturnSalesStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelReturnSales,
  deleteReturnSales,
  exportReturnSales,
  getReturnSalesPage,
} from '#/api/mes/wm/returnsales';
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

/** 创建销售退货单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看销售退货单 */
function handleDetail(row: MesWmReturnSalesApi.ReturnSales) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑销售退货单 */
function handleEdit(row: MesWmReturnSalesApi.ReturnSales) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行上架 */
function handleStock(row: MesWmReturnSalesApi.ReturnSales) {
  formModalApi.setData({ formType: 'stock', id: row.id }).open();
}

/** 执行退货 */
function handleFinish(row: MesWmReturnSalesApi.ReturnSales) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 提示前往质检模块 */
function handleQc() {
  message.info('请前往【质量管理 - 退货检验（RQC）】中进行退货检验操作');
}

/** 删除销售退货单 */
async function handleDelete(row: MesWmReturnSalesApi.ReturnSales) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteReturnSales(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消销售退货单 */
async function handleCancel(row: MesWmReturnSalesApi.ReturnSales) {
  await cancelReturnSales(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportReturnSales(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '销售退货单.xls', source: data });
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
          return await getReturnSalesPage({
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
  } as VxeTableGridOptions<MesWmReturnSalesApi.ReturnSales>,
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

    <Grid table-title="销售退货单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['销售退货单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-return-sales:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-return-sales:export'],
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
              auth: ['mes:wm-return-sales:update'],
              ifShow: row.status === MesWmReturnSalesStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-return-sales:delete'],
              ifShow: row.status === MesWmReturnSalesStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行质检',
              type: 'link',
              ifShow: row.status === MesWmReturnSalesStatusEnum.CONFIRMED,
              onClick: handleQc,
            },
            {
              label: '执行退货',
              type: 'link',
              auth: ['mes:wm-return-sales:finish'],
              ifShow: row.status === MesWmReturnSalesStatusEnum.APPROVING,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '执行上架',
              type: 'link',
              auth: ['mes:wm-return-sales:stock'],
              ifShow: row.status === MesWmReturnSalesStatusEnum.APPROVED,
              onClick: handleStock.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:wm-return-sales:cancel'],
              ifShow:
                row.status === MesWmReturnSalesStatusEnum.CONFIRMED ||
                row.status === MesWmReturnSalesStatusEnum.APPROVING ||
                row.status === MesWmReturnSalesStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该销售退货单？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
