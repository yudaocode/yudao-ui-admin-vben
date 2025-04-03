<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemSmsTemplateApi } from '#/api/system/sms/smsTemplate';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSmsTemplate,
  exportSmsTemplate,
  getSmsTemplatePage,
} from '#/api/system/sms/smsTemplate';
import { $t } from '#/locales';
import { downloadByData } from '#/utils/download';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import SendForm from './modules/send-form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [SendModal, sendModalApi] = useVbenModal({
  connectedComponent: SendForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await exportSmsTemplate(await gridApi.formApi.getValues());
  downloadByData(data, '短信模板.xls');
}

/** 创建短信模板 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑短信模板 */
function onEdit(row: SystemSmsTemplateApi.SmsTemplateVO) {
  formModalApi.setData(row).open();
}

/** 发送测试短信 */
function onSend(row: SystemSmsTemplateApi.SmsTemplateVO) {
  sendModalApi.setData(row).open();
}

/** 删除短信模板 */
async function onDelete(row: SystemSmsTemplateApi.SmsTemplateVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteSmsTemplate(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
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
}: OnActionClickParams<SystemSmsTemplateApi.SmsTemplateVO>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'sms-send': {
      onSend(row);
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
          return await getSmsTemplatePage({
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
  } as VxeTableGridOptions<SystemSmsTemplateApi.SmsTemplateVO>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <SendModal />
    <Grid table-title="短信模板列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['短信模板']) }}
        </Button>
        <Button type="primary" class="ml-2" @click="onExport">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
