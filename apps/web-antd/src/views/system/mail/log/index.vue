<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemMailLogApi } from '#/api/system/mail/log';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMailLogPage, resendMail } from '#/api/system/mail/log';

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

/** 查看邮件日志详情 */
function onView(row: SystemMailLogApi.MailLogVO) {
  formModalApi.setData(row).open();
}

/** 重新发送邮件 */
async function onResend(row: SystemMailLogApi.MailLogVO) {
  const hideLoading = message.loading({
    content: '重新发送邮件中...',
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await resendMail(row.id as number);
    message.success({
      content: '重新发送邮件成功',
      key: 'action_process_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemMailLogApi.MailLogVO>) {
  switch (code) {
    case 'resend': {
      onResend(row);
      break;
    }
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
  } as VxeTableGridOptions<SystemMailLogApi.MailLogVO>,
});
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="邮件日志列表">
      <template #toolbar-tools> </template>
    </Grid>
  </Page>
</template>
