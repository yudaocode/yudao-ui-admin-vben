<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaMailProviderApi } from '#/api/oa/mail/provider';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteMailProvider,
  getMailProviderList,
} from '#/api/oa/mail/provider';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'OaMailProvider' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建邮箱服务 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑邮箱服务 */
function handleEdit(row: OaMailProviderApi.MailProvider) {
  formModalApi.setData(row).open();
}

/** 删除邮箱服务 */
async function handleDelete(row: OaMailProviderApi.MailProvider) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
  });
  try {
    await deleteMailProvider(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params, formValues) => {
          const data = await getMailProviderList();
          // 接口返回完整配置列表，名称和状态在本地过滤
          const list = data.filter(
            (item) =>
              item.name
                .toLowerCase()
                .includes((formValues.name || '').trim().toLowerCase()) &&
              (!Number.isInteger(formValues.status) ||
                item.status === formValues.status),
          );
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaMailProviderApi.MailProvider>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="【办公】企业邮箱" url="https://doc.iocoder.cn/oa/mail/" />
    <FormModal @success="handleRefresh" />

    <Grid table-title="邮箱服务列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['邮箱服务']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:mail-provider:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #imapServer="{ row }">
        {{ row.imap.host }}:{{ row.imap.port }}
      </template>
      <template #smtpServer="{ row }">
        {{ row.smtp.host }}:{{ row.smtp.port }}
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['oa:mail-provider:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:mail-provider:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
