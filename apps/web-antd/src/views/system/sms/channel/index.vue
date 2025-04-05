<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemSmsChannelApi } from '#/api/system/sms/channel';

import { Page, useVbenModal } from '@vben/common-ui';
import { Button, message } from 'ant-design-vue';
import { Download, Plus } from '@vben/icons';
import Form from './modules/form.vue';
import { DocAlert } from '#/components/doc-alert';

import { $t } from '#/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSmsChannelPage, deleteSmsChannel, exportSmsChannel } from '#/api/system/sms/channel';
import { downloadByData } from '#/utils/download';

import { useGridColumns, useGridFormSchema } from './data';

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
function onEdit(row: SystemSmsChannelApi.SystemSmsChannel) {
  formModalApi.setData(row).open();
}

/** 删除短信渠道 */
async function onDelete(row: SystemSmsChannelApi.SystemSmsChannel) {
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
}: OnActionClickParams<SystemSmsChannelApi.SystemSmsChannel>) {
  switch (code) {
    case 'edit': {
      onEdit(row);
      break;
    }
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
  } as VxeTableGridOptions<SystemSmsChannelApi.SystemSmsChannel>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="短信配置" url="https://doc.iocoder.cn/sms/" />

    <FormModal @success="onRefresh" />
    <Grid table-title="短信渠道列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate" v-access:code="['system:sms-channel:create']">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['短信渠道']) }}
        </Button>
        <Button type="primary" class="ml-2" @click="onExport" v-access:code="['system:sms-channel:export']">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
