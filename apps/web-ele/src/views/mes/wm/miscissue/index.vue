<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMiscIssueApi } from '#/api/mes/wm/miscissue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmMiscIssueStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelMiscIssue,
  deleteMiscIssue,
  exportMiscIssue,
  getMiscIssuePage,
} from '#/api/mes/wm/miscissue';
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

/** 创建杂项出库单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看杂项出库单 */
function handleDetail(row: MesWmMiscIssueApi.MiscIssue) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑杂项出库单 */
function handleEdit(row: MesWmMiscIssueApi.MiscIssue) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行出库 */
function handleFinish(row: MesWmMiscIssueApi.MiscIssue) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除杂项出库单 */
async function handleDelete(row: MesWmMiscIssueApi.MiscIssue) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.code]),
  });
  try {
    await deleteMiscIssue(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 取消杂项出库单 */
async function handleCancel(row: MesWmMiscIssueApi.MiscIssue) {
  await cancelMiscIssue(row.id!);
  ElMessage.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportMiscIssue(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '杂项出库单.xls', source: data });
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
          return await getMiscIssuePage({
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
  } as VxeTableGridOptions<MesWmMiscIssueApi.MiscIssue>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】其他入库、其他出库"
        url="https://doc.iocoder.cn/mes/wm/misc/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="杂项出库单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['杂项出库单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-misc-issue:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-misc-issue:export'],
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
              auth: ['mes:wm-misc-issue:update'],
              ifShow: row.status === MesWmMiscIssueStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-misc-issue:delete'],
              ifShow: row.status === MesWmMiscIssueStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行出库',
              type: 'primary',
              link: true,
              auth: ['mes:wm-misc-issue:finish'],
              ifShow: row.status === MesWmMiscIssueStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'danger',
              link: true,
              auth: ['mes:wm-misc-issue:update'],
              ifShow: row.status === MesWmMiscIssueStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该杂项出库单？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
