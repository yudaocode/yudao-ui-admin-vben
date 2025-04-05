<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { Page, useVbenModal } from '@vben/common-ui';
import { DocAlert } from '#/components/doc-alert';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getNotifyMessagePage } from '#/api/system/notify/message';
import Detail from './modules/detail.vue';

import { useGridColumns, useGridFormSchema } from './data';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 查看站内信详情 */
function onView(row: SystemNotifyMessageApi.SystemNotifyMessage) {
  detailModalApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemNotifyMessageApi.SystemNotifyMessage>) {
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
          return await getNotifyMessagePage({
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
  } as VxeTableGridOptions<SystemNotifyMessageApi.SystemNotifyMessage>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="短信配置" url="https://doc.iocoder.cn/sms/" />

    <DetailModal @success="onRefresh" />
    <Grid table-title="站内信列表" />
  </Page>
</template>
