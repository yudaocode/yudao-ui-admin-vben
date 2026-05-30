<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcIpqcApi } from '#/api/mes/qc/ipqc';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesQcStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteIpqc, exportIpqc, getIpqcPage } from '#/api/mes/qc/ipqc';
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

/** 创建过程检验单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看过程检验单 */
function handleDetail(row: MesQcIpqcApi.Ipqc) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑过程检验单 */
function handleEdit(row: MesQcIpqcApi.Ipqc) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 删除过程检验单 */
async function handleDelete(row: MesQcIpqcApi.Ipqc) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.code]),
  });
  try {
    await deleteIpqc(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 导出表格 */
async function handleExport() {
  const data = await exportIpqc(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '过程检验单.xls', source: data });
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
          return await getIpqcPage({
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
  } as VxeTableGridOptions<MesQcIpqcApi.Ipqc>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【质量】过程检验（IPQC）"
        url="https://doc.iocoder.cn/mes/qc/ipqc/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="过程检验单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['过程检验单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:qc-ipqc:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:qc-ipqc:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <ElButton link type="primary" @click="handleDetail(row)">
          {{ row.code }}
        </ElButton>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['mes:qc-ipqc:update'],
              ifShow: row.status === MesQcStatusEnum.DRAFT,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:qc-ipqc:delete'],
              ifShow: row.status === MesQcStatusEnum.DRAFT,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: $t('common.detail'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['mes:qc-ipqc:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
