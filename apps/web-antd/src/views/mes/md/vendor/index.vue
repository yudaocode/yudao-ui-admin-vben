<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdVendorApi } from '#/api/mes/md/vendor';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteVendor, exportVendor, getVendorPage } from '#/api/mes/md/vendor';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import ImportForm from './modules/import-form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [ImportModal, importModalApi] = useVbenModal({
  connectedComponent: ImportForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建供应商 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看供应商 */
function handleDetail(row: MesMdVendorApi.Vendor) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑供应商 */
function handleEdit(row: MesMdVendorApi.Vendor) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除供应商 */
async function handleDelete(row: MesMdVendorApi.Vendor) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteVendor(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出表格 */
async function handleExport() {
  const data = await exportVendor(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '供应商.xls', source: data });
}

/** 导入供应商 */
function handleImport() {
  importModalApi.open();
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
          return await getVendorPage({
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
  } as VxeTableGridOptions<MesMdVendorApi.Vendor>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【基础】客户管理、供应商管理"
        url="https://doc.iocoder.cn/mes/md/client-vendor/"
      />
    </template>

    <FormModal @success="handleRefresh" />
    <ImportModal @success="handleRefresh" />

    <Grid table-title="供应商列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['供应商']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:md-vendor:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.import', ['供应商']),
              type: 'primary',
              icon: ACTION_ICON.UPLOAD,
              auth: ['mes:md-vendor:import'],
              onClick: handleImport,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:md-vendor:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <Button type="link" @click="handleDetail(row)">
          {{ row.code }}
        </Button>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mes:md-vendor:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:md-vendor:delete'],
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
