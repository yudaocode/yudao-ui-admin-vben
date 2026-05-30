<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvRepairApi } from '#/api/mes/dv/repair';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesDvRepairStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteRepair, exportRepair, getRepairPage } from '#/api/mes/dv/repair';
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

/** 创建维修工单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看维修工单 */
function handleDetail(row: MesDvRepairApi.Repair) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑维修工单 */
function handleEdit(row: MesDvRepairApi.Repair) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 完成维修 */
function handleConfirm(row: MesDvRepairApi.Repair) {
  formModalApi.setData({ id: row.id, formType: 'confirm' }).open();
}

/** 验收维修 */
function handleFinish(row: MesDvRepairApi.Repair) {
  formModalApi.setData({ id: row.id, formType: 'finish' }).open();
}

/** 删除维修工单 */
async function handleDelete(row: MesDvRepairApi.Repair) {
  const hideLoading = ElLoading.service({ text: $t('ui.actionMessage.deleting', [row.name]) });
  try {
    await deleteRepair(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading.close();
  }
}

/** 导出维修工单 */
async function handleExport() {
  const data = await exportRepair(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '维修工单.xls', source: data });
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
          await getRepairPage({ pageNo: page.currentPage, pageSize: page.pageSize, ...formValues }),
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
  } as VxeTableGridOptions<MesDvRepairApi.Repair>,
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
    <Grid table-title="维修工单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['维修工单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:dv-repair:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:dv-repair:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <ElButton link type="primary" @click="handleDetail(row)">{{ row.code }}</ElButton>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['mes:dv-repair:update'],
              ifShow: row.status === MesDvRepairStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:dv-repair:delete'],
              ifShow: row.status === MesDvRepairStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '完成维修',
              type: 'warning',
              link: true,
              auth: ['mes:dv-repair:update'],
              ifShow: row.status === MesDvRepairStatusEnum.CONFIRMED,
              onClick: handleConfirm.bind(null, row),
            },
            {
              label: '验收',
              type: 'warning',
              link: true,
              auth: ['mes:dv-repair:update'],
              ifShow: row.status === MesDvRepairStatusEnum.APPROVING,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: $t('common.detail'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['mes:dv-repair:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
