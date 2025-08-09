<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemMailAccountApi } from '#/api/system/mail/account';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteMailAccount,
  deleteMailAccountList,
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
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.mail]),
    fullscreen: true,
  });
  try {
    await deleteMailAccount(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.mail]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除邮箱账号 */
async function onDeleteBatch() {
  await confirm('确定要批量删除该邮箱账号吗？');
  await deleteMailAccountList(checkedIds.value);
  checkedIds.value = [];
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  onRefresh();
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: SystemMailAccountApi.MailAccount[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
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
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
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
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['邮箱账号']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:mail-account:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['system:mail-account:delete'],
              onClick: onDeleteBatch,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
