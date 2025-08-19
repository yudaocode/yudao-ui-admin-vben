<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemMailAccountApi } from '#/api/system/mail/account';
import type { SystemMailTemplateApi } from '#/api/system/mail/template';

import { onMounted, ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSimpleMailAccountList } from '#/api/system/mail/account';
import {
  deleteMailTemplate,
  deleteMailTemplateList,
  getMailTemplatePage,
} from '#/api/system/mail/template';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import SendForm from './modules/send-form.vue';

const accountList = ref<SystemMailAccountApi.MailAccount[]>([]);

/** 获取邮箱账号 */
const getAccountMail = (accountId: number) => {
  return accountList.value.find((account) => account.id === accountId)?.mail;
};

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

/** 创建邮件模板 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑邮件模板 */
function onEdit(row: SystemMailTemplateApi.MailTemplate) {
  formModalApi.setData(row).open();
}

/** 发送测试邮件 */
function onSend(row: SystemMailTemplateApi.MailTemplate) {
  sendModalApi.setData(row).open();
}

/** 删除邮件模板 */
async function onDelete(row: SystemMailTemplateApi.MailTemplate) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteMailTemplate(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除邮件模板 */
async function onDeleteBatch() {
  await confirm('确定要批量删除该邮件模板吗？');
  await deleteMailTemplateList(checkedIds.value);
  checkedIds.value = [];
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  onRefresh();
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: SystemMailTemplateApi.MailTemplate[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemMailTemplateApi.MailTemplate>) {
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
    columns: useGridColumns(onActionClick, getAccountMail),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMailTemplatePage({
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
  } as VxeTableGridOptions<SystemMailTemplateApi.MailTemplate>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 初始化 */
onMounted(async () => {
  accountList.value = await getSimpleMailAccountList();
});
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="邮件配置" url="https://doc.iocoder.cn/mail" />
    </template>

    <FormModal @success="onRefresh" />
    <SendModal />
    <Grid table-title="邮件模板列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['邮件模板']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:mail-template:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['system:mail-template:delete'],
              onClick: onDeleteBatch,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
