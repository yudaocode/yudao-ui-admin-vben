<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmOutsourceIssueApi } from '#/api/mes/wm/outsourceissue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmOutsourceIssueStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelOutsourceIssue,
  deleteOutsourceIssue,
  exportOutsourceIssue,
  getOutsourceIssuePage,
} from '#/api/mes/wm/outsourceissue';
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

/** 创建外协发料单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看外协发料单 */
function handleDetail(row: MesWmOutsourceIssueApi.OutsourceIssue) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑外协发料单 */
function handleEdit(row: MesWmOutsourceIssueApi.OutsourceIssue) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行拣货 */
function handleStock(row: MesWmOutsourceIssueApi.OutsourceIssue) {
  formModalApi.setData({ formType: 'stock', id: row.id }).open();
}

/** 执行领出 */
function handleFinish(row: MesWmOutsourceIssueApi.OutsourceIssue) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除外协发料单 */
async function handleDelete(row: MesWmOutsourceIssueApi.OutsourceIssue) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteOutsourceIssue(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消外协发料单 */
async function handleCancel(row: MesWmOutsourceIssueApi.OutsourceIssue) {
  await cancelOutsourceIssue(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportOutsourceIssue(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '外协发料单.xls', source: data });
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
          return await getOutsourceIssuePage({
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
  } as VxeTableGridOptions<MesWmOutsourceIssueApi.OutsourceIssue>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】外协发料、外协入库"
        url="https://doc.iocoder.cn/mes/wm/outsource/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="外协发料单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['外协发料单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-outsource-issue:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-outsource-issue:export'],
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
              auth: ['mes:wm-outsource-issue:update'],
              ifShow: row.status === MesWmOutsourceIssueStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-outsource-issue:delete'],
              ifShow: row.status === MesWmOutsourceIssueStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行拣货',
              type: 'link',
              auth: ['mes:wm-outsource-issue:update'],
              ifShow: row.status === MesWmOutsourceIssueStatusEnum.APPROVING,
              onClick: handleStock.bind(null, row),
            },
            {
              label: '执行领出',
              type: 'link',
              auth: ['mes:wm-outsource-issue:finish'],
              ifShow: row.status === MesWmOutsourceIssueStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:wm-outsource-issue:update'],
              ifShow:
                row.status === MesWmOutsourceIssueStatusEnum.APPROVING ||
                row.status === MesWmOutsourceIssueStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该外协发料单？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
