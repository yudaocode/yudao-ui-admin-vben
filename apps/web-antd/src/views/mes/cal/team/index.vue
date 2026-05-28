<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesCalTeamApi } from '#/api/mes/cal/team';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTeam, exportTeam, getTeamPage } from '#/api/mes/cal/team';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建班组 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看班组 */
function handleDetail(row: MesCalTeamApi.Team) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑班组 */
function handleEdit(row: MesCalTeamApi.Team) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除班组 */
async function handleDelete(row: MesCalTeamApi.Team) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteTeam(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出班组 */
async function handleExport() {
  const data = await exportTeam(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '班组.xls', source: data });
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
          return await getTeamPage({
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
  } as VxeTableGridOptions<MesCalTeamApi.Team>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【排班】班组设置、节假日设置"
        url="https://doc.iocoder.cn/mes/cal/team/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid table-title="班组列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['班组']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:cal-team:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:cal-team:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <Button type="link" @click="handleDetail(row)">{{ row.code }}</Button>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mes:cal-team:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:cal-team:delete'],
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
