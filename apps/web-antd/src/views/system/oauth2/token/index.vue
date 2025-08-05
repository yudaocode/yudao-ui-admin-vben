<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemOAuth2TokenApi } from '#/api/system/oauth2/token';

import { DocAlert, Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
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
async function handleDelete(row: SystemOAuth2TokenApi.OAuth2Token) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', ['令牌']),
    key: 'action_key_msg',
  });
  try {
    await deleteOAuth2Token(row.accessToken);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', ['令牌']),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
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

    <Grid table-title="令牌列表">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '强退',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:oauth2-token:delete'],
              popConfirm: {
                title: `确定要强退令牌吗？`,
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
