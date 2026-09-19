<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaDiscussionApi } from '#/api/oa/discussion';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { buildSortingField } from '@vben/request';
import { useUserStore } from '@vben/stores';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDiscussion,
  getDiscussionManagePage,
} from '#/api/oa/discussion';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'OaDiscussionManage' });

const router = useRouter();
const userStore = useUserStore();
const currentUserId = userStore.userInfo?.id; // 当前用户编号
const isSuperAdmin = !!userStore.userRoles?.includes('super_admin'); // 管理员可查询全部讨论

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 发布讨论 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 修改讨论 */
function handleEdit(row: OaDiscussionApi.Discussion) {
  formModalApi.setData({ id: row.id }).open();
}

/** 打开讨论详情 */
function handleDetail(row: OaDiscussionApi.Discussion) {
  router.push({
    name: 'OaDiscussionDetail',
    params: { id: row.id },
  });
}

/** 删除讨论 */
async function handleDelete(row: OaDiscussionApi.Discussion) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.title]),
    duration: 0,
  });
  try {
    await deleteDiscussion(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(isSuperAdmin),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page, sorts }, formValues) => {
          return await getDiscussionManagePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            ...buildSortingField(sorts),
          });
        },
      },
      sort: true,
    },
    sortConfig: {
      remote: true,
      multiple: false,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaDiscussionApi.Discussion>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />

    <Grid table-title="讨论列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '发布',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:discussion:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #title="{ row }">
        <span class="cursor-pointer text-primary" @click="handleDetail(row)">
          {{ row.title }}
        </span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:discussion:update'],
              ifShow: row.userId === currentUserId,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:discussion:delete'],
              ifShow: isSuperAdmin || row.userId === currentUserId,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.title]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
