<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesCalPlanApi } from '#/api/mes/cal/plan';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesCalPlanStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePlan, exportPlan, getPlanPage } from '#/api/mes/cal/plan';
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

/** 创建排班计划 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看排班计划 */
function handleDetail(row: MesCalPlanApi.Plan) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑排班计划 */
function handleEdit(row: MesCalPlanApi.Plan) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除排班计划 */
async function handleDelete(row: MesCalPlanApi.Plan) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deletePlan(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出排班计划 */
async function handleExport() {
  const data = await exportPlan(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '排班计划.xls', source: data });
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
          await getPlanPage({ pageNo: page.currentPage, pageSize: page.pageSize, ...formValues }),
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
  } as VxeTableGridOptions<MesCalPlanApi.Plan>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【排班】排班计划、排班日历"
        url="https://doc.iocoder.cn/mes/cal/calendar/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid table-title="排班计划列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['排班计划']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:cal-plan:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:cal-plan:export'],
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
          v-if="row.status === MesCalPlanStatusEnum.PREPARE"
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mes:cal-plan:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:cal-plan:delete'],
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
