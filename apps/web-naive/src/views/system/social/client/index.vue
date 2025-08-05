<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemSocialClientApi } from '#/api/system/social/client';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSocialClient,
  getSocialClientPage,
} from '#/api/system/social/client';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建社交客户端 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑社交客户端 */
function onEdit(row: SystemSocialClientApi.SocialClient) {
  formModalApi.setData(row).open();
}

/** 删除社交客户端 */
async function onDelete(row: SystemSocialClientApi.SocialClient) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteSocialClient(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemSocialClientApi.SocialClient>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
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
          return await getSocialClientPage({
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
  } as VxeTableGridOptions<SystemSocialClientApi.SocialClient>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="三方登录" url="https://doc.iocoder.cn/social-user/" />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="社交客户端列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:social-client:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['社交客户端']) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
