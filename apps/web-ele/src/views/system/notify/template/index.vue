<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemNotifyTemplateApi } from '#/api/system/notify/template';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNotifyTemplate,
  deleteNotifyTemplateList,
  exportNotifyTemplate,
  getNotifyTemplatePage,
} from '#/api/system/notify/template';
import { $t } from '#/locales';

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
  const data = await exportNotifyTemplate(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '站内信模板.xls', source: data });
}

/** 创建站内信模板 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑站内信模板 */
function onEdit(row: SystemNotifyTemplateApi.NotifyTemplate) {
  formModalApi.setData(row).open();
}

/** 发送测试站内信 */
function onSend(row: SystemNotifyTemplateApi.NotifyTemplate) {
  sendModalApi.setData(row).open();
}

/** 删除站内信模板 */
async function onDelete(row: SystemNotifyTemplateApi.NotifyTemplate) {
  const loadingInstance = ElMessage({
    message: $t('ui.actionMessage.deleting', [row.name]),
    type: 'info',
    duration: 0,
  });
  try {
    await deleteNotifyTemplate(row.id as number);
    loadingInstance.close();
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除站内信模板 */
async function onDeleteBatch() {
  const loadingInstance = ElMessage({
    message: $t('ui.actionMessage.deleting'),
    type: 'info',
    duration: 0,
  });
  try {
    await deleteNotifyTemplateList(checkedIds.value);
    checkedIds.value = [];
    loadingInstance.close();
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: SystemNotifyTemplateApi.NotifyTemplate[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemNotifyTemplateApi.NotifyTemplate>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'send': {
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
          return await getNotifyTemplatePage({
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
  } as VxeTableGridOptions<SystemNotifyTemplateApi.NotifyTemplate>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="站内信" url="https://doc.iocoder.cn/notify/" />
    </template>

    <FormModal @success="onRefresh" />
    <SendModal />
    <Grid table-title="站内信模板列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['站内信模板']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:notify-template:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['system:notify-template:export'],
              onClick: onExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['system:notify-template:delete'],
              onClick: onDeleteBatch,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
