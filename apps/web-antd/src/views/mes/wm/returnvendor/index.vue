<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmReturnVendorApi } from '#/api/mes/wm/returnvendor';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmReturnVendorStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelReturnVendor,
  deleteReturnVendor,
  exportReturnVendor,
  getReturnVendorPage,
} from '#/api/mes/wm/returnvendor';
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

/** 创建供应商退货单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看供应商退货单 */
function handleDetail(row: MesWmReturnVendorApi.ReturnVendor) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑供应商退货单 */
function handleEdit(row: MesWmReturnVendorApi.ReturnVendor) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行拣货 */
function handleStock(row: MesWmReturnVendorApi.ReturnVendor) {
  formModalApi.setData({ formType: 'stock', id: row.id }).open();
}

/** 完成退货 */
function handleFinish(row: MesWmReturnVendorApi.ReturnVendor) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除供应商退货单 */
async function handleDelete(row: MesWmReturnVendorApi.ReturnVendor) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteReturnVendor(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消供应商退货单 */
async function handleCancel(row: MesWmReturnVendorApi.ReturnVendor) {
  await cancelReturnVendor(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportReturnVendor(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '供应商退货单.xls', source: data });
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
          return await getReturnVendorPage({
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
  } as VxeTableGridOptions<MesWmReturnVendorApi.ReturnVendor>,
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

    <Grid table-title="供应商退货单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['供应商退货单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-return-vendor:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-return-vendor:export'],
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
              auth: ['mes:wm-return-vendor:update'],
              ifShow: row.status === MesWmReturnVendorStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-return-vendor:delete'],
              ifShow: row.status === MesWmReturnVendorStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行拣货',
              type: 'link',
              auth: ['mes:wm-return-vendor:update'],
              ifShow: row.status === MesWmReturnVendorStatusEnum.APPROVING,
              onClick: handleStock.bind(null, row),
            },
            {
              label: '完成退货',
              type: 'link',
              auth: ['mes:wm-return-vendor:update-status'],
              ifShow: row.status === MesWmReturnVendorStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:wm-return-vendor:update'],
              ifShow:
                row.status === MesWmReturnVendorStatusEnum.APPROVING ||
                row.status === MesWmReturnVendorStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该供应商退货单？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
