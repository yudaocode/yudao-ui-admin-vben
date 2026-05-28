<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvSubjectApi } from '#/api/mes/dv/subject';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteSubject, exportSubject, getSubjectPage } from '#/api/mes/dv/subject';
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

/** 创建点检保养项目 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看点检保养项目 */
function handleDetail(row: MesDvSubjectApi.Subject) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑点检保养项目 */
function handleEdit(row: MesDvSubjectApi.Subject) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除点检保养项目 */
async function handleDelete(row: MesDvSubjectApi.Subject) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteSubject(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出点检保养项目 */
async function handleExport() {
  const data = await exportSubject(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '点检保养项目.xls', source: data });
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
        query: async ({ page }, formValues) =>
          await getSubjectPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
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
  } as VxeTableGridOptions<MesDvSubjectApi.Subject>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【设备】点检保养项目、点检保养方案"
        url="https://doc.iocoder.cn/mes/dv/check-plan/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid table-title="点检保养项目列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['点检保养项目']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:dv-subject:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:dv-subject:export'],
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
              auth: ['mes:dv-subject:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:dv-subject:delete'],
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
