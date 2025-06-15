<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemOAuth2TokenApi } from '#/api/system/oauth2/token';

import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteOAuth2Token,
  deleteOAuth2TokenList,
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

// 选中的令牌ID
const checkedAccessTokens = ref<string[]>([]);

/** 处理表格选择变化 */
function handleSelectionChange({
  selectRecords,
}: {
  selectRecords: SystemOAuth2TokenApi.OAuth2Token[];
}) {
  checkedAccessTokens.value = selectRecords.map((row) => row.accessToken);
}

/** 批量删除处理 */
async function handleDeleteBatch() {
  if (checkedAccessTokens.value.length === 0) {
    message.warning('请至少选择一条数据');
    return;
  }
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', ['令牌']),
    key: 'action_key_msg',
  });
  try {
    await deleteOAuth2TokenList(checkedAccessTokens.value);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', ['令牌']),
      key: 'action_key_msg',
    });
    checkedAccessTokens.value = [];
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
      refresh: { code: 'query' },
      search: true,
      slots: {
        buttons: 'toolbar_buttons',
      },
    },
    checkboxConfig: {
      checkField: 'checked',
      trigger: 'row',
      highlight: true,
      range: true,
    },
    events: {
      checkboxChange: handleSelectionChange,
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
      <template #toolbar_buttons>
        <a-button
          v-auth="['system:oauth2-token:delete']"
          type="primary"
          danger
          :disabled="checkedAccessTokens.length === 0"
          @click="handleDeleteBatch"
        >
          <template #icon>
            <component :is="ACTION_ICON.DELETE" />
          </template>
          批量强退
        </a-button>
      </template>
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
