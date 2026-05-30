<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmReturnIssueApi } from '#/api/mes/wm/returnissue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmReturnIssueStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelReturnIssue,
  deleteReturnIssue,
  exportReturnIssue,
  getReturnIssuePage,
} from '#/api/mes/wm/returnissue';
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

/** 创建生产退料单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看生产退料单 */
function handleDetail(row: MesWmReturnIssueApi.ReturnIssue) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑生产退料单 */
function handleEdit(row: MesWmReturnIssueApi.ReturnIssue) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行上架 */
function handleStock(row: MesWmReturnIssueApi.ReturnIssue) {
  formModalApi.setData({ formType: 'stock', id: row.id }).open();
}

/** 执行退料 */
function handleFinish(row: MesWmReturnIssueApi.ReturnIssue) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 提示前往质检模块 */
function handleQc() {
  message.info('请前往【质量管理 - 退货检验（RQC）】中进行退料检验操作');
}

/** 删除生产退料单 */
async function handleDelete(row: MesWmReturnIssueApi.ReturnIssue) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteReturnIssue(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消生产退料单 */
async function handleCancel(row: MesWmReturnIssueApi.ReturnIssue) {
  await cancelReturnIssue(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportReturnIssue(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '生产退料单.xls', source: data });
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
          return await getReturnIssuePage({
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
  } as VxeTableGridOptions<MesWmReturnIssueApi.ReturnIssue>,
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

    <Grid table-title="生产退料单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['生产退料单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-return-issue:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-return-issue:export'],
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
              auth: ['mes:wm-return-issue:update'],
              ifShow: row.status === MesWmReturnIssueStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-return-issue:delete'],
              ifShow: row.status === MesWmReturnIssueStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行质检',
              type: 'link',
              ifShow: row.status === MesWmReturnIssueStatusEnum.CONFIRMED,
              onClick: handleQc,
            },
            {
              label: '执行上架',
              type: 'link',
              auth: ['mes:wm-return-issue:update'],
              ifShow: row.status === MesWmReturnIssueStatusEnum.APPROVING,
              onClick: handleStock.bind(null, row),
            },
            {
              label: '执行退料',
              type: 'link',
              auth: ['mes:wm-return-issue:finish'],
              ifShow: row.status === MesWmReturnIssueStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:wm-return-issue:update'],
              ifShow:
                row.status === MesWmReturnIssueStatusEnum.CONFIRMED ||
                row.status === MesWmReturnIssueStatusEnum.APPROVING ||
                row.status === MesWmReturnIssueStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该生产退料单？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
