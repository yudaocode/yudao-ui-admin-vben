<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ReportUReportFileApi } from '#/api/report/ureport';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from '#/adapter/naive';
import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteUReportFile, getUReportFilePage } from '#/api/report/ureport';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Frame from './modules/frame.vue';

defineOptions({ name: 'UReport' });

const [FrameModal, frameModalApi] = useVbenModal({
  connectedComponent: Frame,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新建报表 */
function handleCreate() {
  frameModalApi.setData({ type: 'design' }).open();
}

/** 设计报表 */
function handleDesign(row: ReportUReportFileApi.UReportFile) {
  frameModalApi.setData({ type: 'design', name: row.name }).open();
}

/** 预览报表 */
function handlePreview(row: ReportUReportFileApi.UReportFile) {
  frameModalApi.setData({ type: 'preview', name: row.name }).open();
}

/** 删除报表 */
async function handleDelete(row: ReportUReportFileApi.UReportFile) {
  const hideLoading = message.loading(
    $t('ui.actionMessage.deleting', [row.name]),
    { duration: 0 },
  );
  try {
    await deleteUReportFile(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading.destroy();
  }
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
          return await getUReportFilePage({
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
  } as VxeTableGridOptions<ReportUReportFileApi.UReportFile>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="UReport2 报表"
        url="https://doc.iocoder.cn/report/ureport/"
      />
    </template>

    <FrameModal @success="handleRefresh" />
    <Grid table-title="报表列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['报表']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['report:ureport:design'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '设计',
              type: 'primary',
              text: true,
              icon: ACTION_ICON.EDIT,
              auth: ['report:ureport:design'],
              onClick: handleDesign.bind(null, row),
            },
            {
              label: '预览',
              type: 'primary',
              text: true,
              icon: ACTION_ICON.VIEW,
              auth: ['report:ureport:query', 'report:ureport:design'],
              onClick: handlePreview.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'error',
              text: true,
              icon: ACTION_ICON.DELETE,
              auth: ['report:ureport:design'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
