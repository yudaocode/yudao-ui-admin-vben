<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvMaintenRecordApi } from '#/api/mes/dv/maintenrecord';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesDvMaintenRecordStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteMaintenRecord,
  exportMaintenRecord,
  getMaintenRecordPage,
} from '#/api/mes/dv/maintenrecord';
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

/** 创建保养记录 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看保养记录 */
function handleDetail(row: MesDvMaintenRecordApi.MaintenRecord) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑保养记录 */
function handleEdit(row: MesDvMaintenRecordApi.MaintenRecord) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除保养记录 */
async function handleDelete(row: MesDvMaintenRecordApi.MaintenRecord) {
  const hideLoading = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.machineryName]),
  });
  try {
    await deleteMaintenRecord(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.machineryName]));
    handleRefresh();
  } finally {
    hideLoading.close();
  }
}

/** 导出保养记录 */
async function handleExport() {
  const data = await exportMaintenRecord(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '保养记录.xls', source: data });
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
          await getMaintenRecordPage({
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
  } as VxeTableGridOptions<MesDvMaintenRecordApi.MaintenRecord>,
});
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【设备】点检记录、保养记录、维修单"
        url="https://doc.iocoder.cn/mes/dv/check-record/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid table-title="保养记录列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['保养记录']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:dv-mainten-record:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:dv-mainten-record:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #machineryName="{ row }">
        <ElButton link type="primary" @click="handleDetail(row)">{{ row.machineryName }}</ElButton>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['mes:dv-mainten-record:update'],
              onClick: handleEdit.bind(null, row),
              ifShow: row.status === MesDvMaintenRecordStatusEnum.PREPARE,
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:dv-mainten-record:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.machineryName]),
                confirm: handleDelete.bind(null, row),
              },
              ifShow: row.status === MesDvMaintenRecordStatusEnum.PREPARE,
            },
            {
              label: $t('common.detail'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['mes:dv-mainten-record:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
