<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcIqcApi } from '#/api/mes/qc/iqc';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesQcStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteIqc, exportIqc, getIqcPage } from '#/api/mes/qc/iqc';
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

/** 创建来料检验单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看来料检验单 */
function handleDetail(row: MesQcIqcApi.Iqc) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑来料检验单 */
function handleEdit(row: MesQcIqcApi.Iqc) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 删除来料检验单 */
async function handleDelete(row: MesQcIqcApi.Iqc) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteIqc(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出表格 */
async function handleExport() {
  const data = await exportIqc(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '来料检验单.xls', source: data });
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
          return await getIqcPage({
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
  } as VxeTableGridOptions<MesQcIqcApi.Iqc>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【质量】来料检验（IQC）"
        url="https://doc.iocoder.cn/mes/qc/iqc/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="来料检验单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['来料检验单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:qc-iqc:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:qc-iqc:export'],
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
              auth: ['mes:qc-iqc:update'],
              ifShow: row.status === MesQcStatusEnum.DRAFT,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:qc-iqc:delete'],
              ifShow: row.status === MesQcStatusEnum.DRAFT,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['mes:qc-iqc:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
