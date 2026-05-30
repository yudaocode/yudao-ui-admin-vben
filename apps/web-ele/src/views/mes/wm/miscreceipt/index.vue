<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMiscReceiptApi } from '#/api/mes/wm/miscreceipt';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmMiscReceiptStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelMiscReceipt,
  deleteMiscReceipt,
  exportMiscReceipt,
  getMiscReceiptPage,
} from '#/api/mes/wm/miscreceipt';
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

/** 创建杂项入库单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看杂项入库单 */
function handleDetail(row: MesWmMiscReceiptApi.MiscReceipt) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑杂项入库单 */
function handleEdit(row: MesWmMiscReceiptApi.MiscReceipt) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 执行入库 */
function handleFinish(row: MesWmMiscReceiptApi.MiscReceipt) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除杂项入库单 */
async function handleDelete(row: MesWmMiscReceiptApi.MiscReceipt) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.code]),
  });
  try {
    await deleteMiscReceipt(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 取消杂项入库单 */
async function handleCancel(row: MesWmMiscReceiptApi.MiscReceipt) {
  await cancelMiscReceipt(row.id!);
  ElMessage.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportMiscReceipt(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '杂项入库单.xls', source: data });
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
          return await getMiscReceiptPage({
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
  } as VxeTableGridOptions<MesWmMiscReceiptApi.MiscReceipt>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】其他入库、其他出库"
        url="https://doc.iocoder.cn/mes/wm/misc/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="杂项入库单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['杂项入库单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm:misc-receipt:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm:misc-receipt:export'],
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
              auth: ['mes:wm:misc-receipt:update'],
              ifShow: row.status === MesWmMiscReceiptStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm:misc-receipt:delete'],
              ifShow: row.status === MesWmMiscReceiptStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行入库',
              type: 'primary',
              link: true,
              auth: ['mes:wm:misc-receipt:finish'],
              ifShow: row.status === MesWmMiscReceiptStatusEnum.APPROVED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'danger',
              link: true,
              auth: ['mes:wm:misc-receipt:cancel'],
              ifShow: row.status === MesWmMiscReceiptStatusEnum.APPROVED,
              popConfirm: {
                title: '确认取消该杂项入库单吗？',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
