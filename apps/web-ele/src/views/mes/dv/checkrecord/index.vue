<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvCheckRecordApi } from '#/api/mes/dv/checkrecord';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesDvCheckRecordStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteCheckRecord, exportCheckRecord, getCheckRecordPage } from '#/api/mes/dv/checkrecord';
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

/** 创建点检记录 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看点检记录 */
function handleDetail(row: MesDvCheckRecordApi.CheckRecord) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑点检记录 */
function handleEdit(row: MesDvCheckRecordApi.CheckRecord) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除点检记录 */
async function handleDelete(row: MesDvCheckRecordApi.CheckRecord) {
  const hideLoading = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.machineryName]),
  });
  try {
    await deleteCheckRecord(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.machineryName]));
    handleRefresh();
  } finally {
    hideLoading.close();
  }
}

/** 导出点检记录 */
async function handleExport() {
  const data = await exportCheckRecord(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '点检记录.xls', source: data });
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
          await getCheckRecordPage({
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
  } as VxeTableGridOptions<MesDvCheckRecordApi.CheckRecord>,
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
    <Grid table-title="点检记录列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['点检记录']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:dv-check-record:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:dv-check-record:export'],
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
              auth: ['mes:dv-check-record:update'],
              onClick: handleEdit.bind(null, row),
              ifShow: row.status === MesDvCheckRecordStatusEnum.DRAFT,
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:dv-check-record:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.machineryName]),
                confirm: handleDelete.bind(null, row),
              },
              ifShow: row.status === MesDvCheckRecordStatusEnum.DRAFT,
            },
            {
              label: $t('common.detail'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['mes:dv-check-record:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
