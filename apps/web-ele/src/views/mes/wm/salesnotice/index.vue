<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmSalesNoticeApi } from '#/api/mes/wm/salesnotice';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmSalesNoticeStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSalesNotice,
  exportSalesNotice,
  getSalesNoticePage,
} from '#/api/mes/wm/salesnotice';
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

/** 创建发货通知单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看发货通知单 */
function handleDetail(row: MesWmSalesNoticeApi.SalesNotice) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑发货通知单 */
function handleEdit(row: MesWmSalesNoticeApi.SalesNotice) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行出库 */
function handleFinish(row: MesWmSalesNoticeApi.SalesNotice) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除发货通知单 */
async function handleDelete(row: MesWmSalesNoticeApi.SalesNotice) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.code]),
  });
  try {
    await deleteSalesNotice(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 导出表格 */
async function handleExport() {
  const data = await exportSalesNotice(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '发货通知单.xls', source: data });
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
          return await getSalesNoticePage({
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
  } as VxeTableGridOptions<MesWmSalesNoticeApi.SalesNotice>,
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

    <Grid table-title="发货通知单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['发货通知单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-sales-notice:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-sales-notice:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <ElButton link type="primary" @click="handleDetail(row)">
          {{ row.code }}
        </ElButton>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['mes:wm-sales-notice:update'],
              ifShow: row.status === MesWmSalesNoticeStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-sales-notice:delete'],
              ifShow: row.status === MesWmSalesNoticeStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行出库',
              type: 'primary',
              link: true,
              auth: ['mes:wm-sales-notice:update'],
              ifShow: row.status === MesWmSalesNoticeStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
