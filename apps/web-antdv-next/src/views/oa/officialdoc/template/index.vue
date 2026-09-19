<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaOfficialDocTemplateApi } from '#/api/oa/officialdoc/template';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteOfficialDocTemplate,
  getOfficialDocTemplatePage,
} from '#/api/oa/officialdoc/template';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'OaOfficialDocTemplate' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建套红模板 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑套红模板 */
function handleEdit(row: OaOfficialDocTemplateApi.OfficialDocTemplate) {
  formModalApi.setData({ id: row.id }).open();
}

/** 删除套红模板 */
async function handleDelete(row: OaOfficialDocTemplateApi.OfficialDocTemplate) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteOfficialDocTemplate(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
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
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getOfficialDocTemplatePage({
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
  } as VxeTableGridOptions<OaOfficialDocTemplateApi.OfficialDocTemplate>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />

    <Grid table-title="套红模板列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['套红模板']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:officialdoc-template:create'],
              onClick: handleCreate,
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
              auth: ['oa:officialdoc-template:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:officialdoc-template:delete'],
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
