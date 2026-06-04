<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmProductIssueApi } from '#/api/mes/wm/productissue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmProductIssueStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelProductIssue,
  deleteProductIssue,
  exportProductIssue,
  getProductIssuePage,
  submitProductIssue,
} from '#/api/mes/wm/productissue';
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

/** 创建领料出库单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看领料出库单 */
function handleDetail(row: MesWmProductIssueApi.ProductIssue) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑领料出库单 */
function handleEdit(row: MesWmProductIssueApi.ProductIssue) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行拣货 */
function handleStock(row: MesWmProductIssueApi.ProductIssue) {
  formModalApi.setData({ formType: 'stock', id: row.id }).open();
}

/** 完成领料出库 */
function handleFinish(row: MesWmProductIssueApi.ProductIssue) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 提交领料出库单 */
async function handleSubmit(row: MesWmProductIssueApi.ProductIssue) {
  await submitProductIssue(row.id!);
  message.success('提交成功');
  handleRefresh();
}

/** 删除领料出库单 */
async function handleDelete(row: MesWmProductIssueApi.ProductIssue) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteProductIssue(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消领料出库单 */
async function handleCancel(row: MesWmProductIssueApi.ProductIssue) {
  await cancelProductIssue(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportProductIssue(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '领料出库单.xls', source: data });
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
          return await getProductIssuePage({
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
  } as VxeTableGridOptions<MesWmProductIssueApi.ProductIssue>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】生产领料、生产退料、物料消耗"
        url="https://doc.iocoder.cn/mes/wm/issue-return/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="领料出库单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['领料出库单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-product-issue:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-product-issue:export'],
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
              auth: ['mes:wm-product-issue:update'],
              ifShow: row.status === MesWmProductIssueStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.submit'),
              type: 'link',
              auth: ['mes:wm-product-issue:update'],
              ifShow: row.status === MesWmProductIssueStatusEnum.PREPARE,
              popConfirm: {
                title: '确认提交该领料出库单？提交后将不能修改。',
                confirm: handleSubmit.bind(null, row),
              },
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-product-issue:delete'],
              ifShow: row.status === MesWmProductIssueStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行拣货',
              type: 'link',
              auth: ['mes:wm-product-issue:update'],
              ifShow: row.status === MesWmProductIssueStatusEnum.APPROVING,
              onClick: handleStock.bind(null, row),
            },
            {
              label: '完成',
              type: 'link',
              auth: ['mes:wm-product-issue:finish'],
              ifShow: row.status === MesWmProductIssueStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:wm-product-issue:update'],
              ifShow:
                row.status === MesWmProductIssueStatusEnum.APPROVING ||
                row.status === MesWmProductIssueStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该领料出库单？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
