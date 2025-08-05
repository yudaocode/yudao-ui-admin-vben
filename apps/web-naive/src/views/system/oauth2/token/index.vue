<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemOAuth2TokenApi } from '#/api/system/oauth2/token';

import { DocAlert, Page } from '@vben/common-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteOAuth2Token,
  getOAuth2TokenPage,
} from '#/api/system/oauth2/token';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 删除 OAuth2 令牌 */
async function onDelete(row: SystemOAuth2TokenApi.OAuth2Token) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', ['令牌']),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteOAuth2Token(row.accessToken);
    message.success($t('ui.actionMessage.operationSuccess'));
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemOAuth2TokenApi.OAuth2Token>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
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
          return await getOAuth2TokenPage({
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<SystemOAuth2TokenApi.OAuth2Token>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="OAuth 2.0（SSO 单点登录）"
        url="https://doc.iocoder.cn/oauth2/"
      />
    </template>

    <Grid table-title="令牌列表" />
  </Page>
</template>
