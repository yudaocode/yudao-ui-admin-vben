<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemMailLogApi } from '#/api/system/mail/log';

import { Page, useVbenModal } from '@vben/common-ui';
import Detail from './modules/detail.vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMailLogPage } from '#/api/system/mail/log';

import { useGridColumns, useGridFormSchema } from './data';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 查看邮件日志 */
function onView(row: SystemMailLogApi.SystemMailLog) {
  detailModalApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemMailLogApi.SystemMailLog>) {
  switch (code) {
    case 'view': {
      onView(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMailLogPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SystemMailLogApi.SystemMailLog>,
});
</script>
<template>
  <Page auto-content-height>
    <DetailModal @success="onRefresh" />
    <Grid table-title="邮件日志列表">
      <template #toolbar-tools> </template>
    </Grid>
  </Page>
</template>
