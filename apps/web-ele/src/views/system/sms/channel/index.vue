<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemSmsChannelApi } from '#/api/system/sms/channel';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSmsChannel,
  deleteSmsChannelList,
  exportSmsChannel,
  getSmsChannelPage,
} from '#/api/system/sms/channel';
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

/** 导出表格 */
async function onExport() {
  const data = await exportSmsChannel(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '短信渠道.xls', source: data });
}

/** 创建短信渠道 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑短信渠道 */
function onEdit(row: SystemSmsChannelApi.SmsChannel) {
  formModalApi.setData(row).open();
}

/** 删除短信渠道 */
async function onDelete(row: SystemSmsChannelApi.SmsChannel) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.signature]),
    fullscreen: true,
  });
  try {
    await deleteSmsChannel(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.signature]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除短信渠道 */
async function onDeleteBatch() {
  await confirm('确定要批量删除该短信渠道吗？');
  await deleteSmsChannelList(checkedIds.value);
  checkedIds.value = [];
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  onRefresh();
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: SystemSmsChannelApi.SmsChannel[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemSmsChannelApi.SmsChannel>) {
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<SystemSmsChannelApi.SmsChannel>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="短信配置" url="https://doc.iocoder.cn/sms/" />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="短信渠道列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['短信渠道']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:sms-channel:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['system:sms-channel:export'],
              onClick: onExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['system:sms-channel:delete'],
              onClick: onDeleteBatch,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
