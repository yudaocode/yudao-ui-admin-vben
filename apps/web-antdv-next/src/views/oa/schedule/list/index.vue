<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaScheduleApi } from '#/api/oa/schedule';

import { Page, useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteSchedule, getSchedulePage } from '#/api/oa/schedule';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaScheduleList' });

const userStore = useUserStore(); // 当前用户信息

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 是否为日程创建人，仅创建人可以修改、删除 */
function isCreator(row: OaScheduleApi.Schedule) {
  return row.creator === String(userStore.userInfo?.id);
}

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 日程范围勾选变化后立即查询 */
function handleScopeChange() {
  gridApi.query();
}

/** 创建日程 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑日程 */
function handleEdit(id: number) {
  formModalApi.setData({ id }).open();
}

/** 查看日程详情 */
function handleDetail(row: OaScheduleApi.Schedule) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 删除日程 */
async function handleDelete(row: OaScheduleApi.Schedule) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteSchedule(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(handleScopeChange),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSchedulePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
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
  } as VxeTableGridOptions<OaScheduleApi.Schedule>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <DetailModal @edit="handleEdit" />

    <Grid table-title="日程列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['日程']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:schedule:create'],
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
              auth: ['oa:schedule:update'],
              ifShow: isCreator(row),
              onClick: handleEdit.bind(null, row.id!),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:schedule:delete'],
              ifShow: isCreator(row),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
