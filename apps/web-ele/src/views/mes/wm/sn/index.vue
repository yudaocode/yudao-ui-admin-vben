<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmSnApi } from '#/api/mes/wm/sn';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSnBatch,
  exportSnDetailExcel,
  exportSnGroupExcel,
  getSnGroupPage,
} from '#/api/mes/wm/sn';
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

/** 生成 SN 码 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 导出分组表格 */
async function handleExport() {
  const data = await exportSnGroupExcel(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: 'SN码分组.xls', source: data });
}

/** 导出批次明细 */
async function handleExportDetail(row: MesWmSnApi.SnGroup) {
  const data = await exportSnDetailExcel(row.uuid!);
  downloadFileFromBlobPart({ fileName: 'SN码明细.xls', source: data });
}

/** 删除 SN 码批次 */
async function handleDelete(row: MesWmSnApi.SnGroup) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.batchCode || row.itemName]),
  });
  try {
    await deleteSnBatch(row.uuid!);
    ElMessage.success(
      $t('ui.actionMessage.deleteSuccess', [row.batchCode || '']),
    );
    handleRefresh();
  } finally {
    loadingInstance.close();
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
          return await getSnGroupPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'uuid',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MesWmSnApi.SnGroup>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】仓库与库区库位、条码赋码、SN码"
        url="https://doc.iocoder.cn/mes/wm/warehouse-setup/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="SN 码列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '生成 SN 码',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-sn:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-sn:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '导出明细',
              type: 'primary',
              link: true,
              auth: ['mes:wm-sn:export'],
              onClick: handleExportDetail.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              auth: ['mes:wm-sn:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  row.batchCode || row.itemName,
                ]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
