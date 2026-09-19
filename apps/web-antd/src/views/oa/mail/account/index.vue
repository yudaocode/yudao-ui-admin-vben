<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaMailAccountApi } from '#/api/oa/mail/account';
import type { OaMailProviderApi } from '#/api/oa/mail/provider';

import { ref } from 'vue';

import { alert, Page, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';

import { message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteMailAccount,
  getMailAccountList,
  testMailAccountConnection,
  updateMailAccountDefault,
} from '#/api/oa/mail/account';
import { getSimpleMailProviderList } from '#/api/oa/mail/provider';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'OaMailAccount' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const providers = ref<OaMailProviderApi.MailProvider[]>([]); // 服务配置列表
const testingId = ref<number>(); // 当前测试账号编号

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 绑定邮箱账号 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 修改邮箱账号 */
function handleEdit(row: OaMailAccountApi.MailAccount) {
  formModalApi.setData(row).open();
}

/** 测试连接，不发测试邮件 */
async function handleTest(row: OaMailAccountApi.MailAccount) {
  testingId.value = row.id;
  try {
    const result = await testMailAccountConnection(row.id!);
    const text =
      'IMAP：' +
      (result.imap ? '连接成功' : '连接失败') +
      '；SMTP：' +
      (result.smtp ? '连接成功' : '连接失败');
    await alert(text);
  } finally {
    testingId.value = undefined;
  }
}

/** 设置默认账号 */
async function handleDefault(row: OaMailAccountApi.MailAccount) {
  await updateMailAccountDefault(row.id!);
  message.success($t('ui.actionMessage.operationSuccess'));
  handleRefresh();
}

/** 删除邮箱账号 */
async function handleDelete(row: OaMailAccountApi.MailAccount) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.mail]),
    duration: 0,
  });
  try {
    await deleteMailAccount(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.mail]));
    handleRefresh();
  } finally {
    hideLoading();
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
          const [accounts, mailProviders] = await Promise.all([
            getMailAccountList(),
            getSimpleMailProviderList(),
          ]);
          providers.value = mailProviders;
          // 接口仅返回本人完整账号列表，搜索不改变账号归属范围
          const list = accounts.filter(
            (item) =>
              item.mail
                .toLowerCase()
                .includes((formValues.mail || '').trim().toLowerCase()) &&
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
  } as VxeTableGridOptions<OaMailAccountApi.MailAccount>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />

    <Grid table-title="我的账号">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['邮箱账号']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:mail-account:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #providerName="{ row }">
        {{ providers.find((item) => item.id === row.providerId)?.name }}
      </template>
      <template #defaultTag="{ row }">
        <Tag v-if="row.defaultStatus" color="success">默认</Tag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:mail-account:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '测试连接',
              type: 'link',
              loading: testingId === row.id,
              disabled: row.status !== CommonStatusEnum.ENABLE || testingId !== undefined,
              onClick: handleTest.bind(null, row),
            },
            {
              label: '设为默认',
              type: 'link',
              auth: ['oa:mail-account:update'],
              ifShow:
                !row.defaultStatus && row.status === CommonStatusEnum.ENABLE,
              onClick: handleDefault.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:mail-account:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.mail]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
