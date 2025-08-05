<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemMailAccountApi } from '#/api/system/mail/account';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteMailAccount,
  getMailAccountPage,
} from '#/api/system/mail/account';
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

/** 创建邮箱账号 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑邮箱账号 */
function onEdit(row: SystemMailAccountApi.MailAccount) {
  formModalApi.setData(row).open();
}

/** 删除邮箱账号 */
async function onDelete(row: SystemMailAccountApi.MailAccount) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.mail]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteMailAccount(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.mail]));
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemMailAccountApi.MailAccount>) {
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
          return await getMailAccountPage({
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
  } as VxeTableGridOptions<SystemMailAccountApi.MailAccount>,
});
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="邮件配置" url="https://doc.iocoder.cn/mail" />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="邮箱账号列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:mail-account:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['邮箱账号']) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
