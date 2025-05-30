<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpTagApi } from '#/api/mp/tag';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTag, getTagPage, syncTag } from '#/api/mp/tag';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const accountId = ref(-1);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建标签 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑标签 */
function handleEdit(row: MpTagApi.Tag) {
  formModalApi.setData(row).open();
}

/** 删除标签 */
async function handleDelete(row: MpTagApi.Tag) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: 'action_key_msg',
  });
  try {
    await deleteTag(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}
/** 同步标签 */
async function handleSync() {
  const hideLoading = message.loading({
    content: '是否确认同步标签？',
    key: 'action_key_msg',
  });
  try {
    await syncTag(accountId.value);
    message.success({
      content: '同步标签成功',
      key: 'action_key_msg',
    });
    onRefresh();
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
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          accountId.value = formValues.accountId;
          return await getTagPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            accountId: accountId.value,
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
  } as VxeTableGridOptions<MpTagApi.Tag>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" :account-id="accountId" />
    <Grid table-title="公众号账号列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['公众号账号']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mp:tag:create'],
              onClick: handleCreate,
            },
            {
              label: '同步',
              type: 'primary',
              icon: 'lucide:refresh-ccw',
              auth: ['mp:tag:sync'],
              onClick: handleSync,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mp:tag:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mp:tag:delete'],
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
