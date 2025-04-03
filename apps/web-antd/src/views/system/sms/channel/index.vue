<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemSmsChannelApi } from '#/api/system/sms/smsChannel';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSmsChannel,
  exportSmsChannel,
  getSmsChannelPage,
} from '#/api/system/sms/smsChannel';
import { $t } from '#/locales';
import { downloadByData } from '#/utils/download';

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

/** 导出表格 */
async function onExport() {
  const data = await exportSmsChannel(await gridApi.formApi.getValues());
  downloadByData(data, '短信渠道.xls');
}

/** 创建短信渠道 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑短信渠道 */
function onEdit(row: SystemSmsChannelApi.SmsChannelVO) {
  formModalApi.setData(row).open();
}

/** 删除短信渠道 */
async function onDelete(row: SystemSmsChannelApi.SmsChannelVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.signature]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteSmsChannel(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.signature]),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemSmsChannelApi.SmsChannelVO>) {
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
          return await getSmsChannelPage({
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
  } as VxeTableGridOptions<SystemSmsChannelApi.SmsChannelVO>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="短信渠道列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['短信渠道']) }}
        </Button>
        <Button type="primary" class="ml-2" @click="onExport">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
