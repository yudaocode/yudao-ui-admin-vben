<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesTmToolTypeApi } from '#/api/mes/tm/tool/type';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteToolType, exportToolType, getToolTypePage } from '#/api/mes/tm/tool/type';
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

/** 创建工具类型 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看工具类型 */
function handleDetail(row: MesTmToolTypeApi.ToolType) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑工具类型 */
function handleEdit(row: MesTmToolTypeApi.ToolType) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除工具类型 */
async function handleDelete(row: MesTmToolTypeApi.ToolType) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteToolType(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出工具类型 */
async function handleExport() {
  const data = await exportToolType(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '工具类型.xls', source: data });
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
          await getToolTypePage({
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
  } as VxeTableGridOptions<MesTmToolTypeApi.ToolType>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【工具】工具类型、工装夹具台账"
        url="https://doc.iocoder.cn/mes/tm/tool/"
      />
    </template>

    <FormModal @success="handleRefresh" />
    <Grid table-title="工具类型列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['工具类型']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:tm-tool-type:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:tm-tool-type:export'],
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
              auth: ['mes:tm-tool-type:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:tm-tool-type:delete'],
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
