<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvCheckPlanApi } from '#/api/mes/dv/checkplan';
import type { ActionItem } from '#/components/table-action/typing';

import { Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCheckPlan,
  disableCheckPlan,
  enableCheckPlan,
  exportCheckPlan,
  getCheckPlanPage,
} from '#/api/mes/dv/checkplan';
import { $t } from '#/locales';
import { MesDvCheckPlanStatusEnum } from '#/views/mes/utils/constants';

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

/** 创建点检计划 */
function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

/** 查看点检计划 */
function handleDetail(row: MesDvCheckPlanApi.CheckPlan) {
  formModalApi.setData({ id: row.id, type: 'detail' }).open();
}

/** 编辑点检计划 */
function handleEdit(row: MesDvCheckPlanApi.CheckPlan) {
  formModalApi.setData({ id: row.id, type: 'update' }).open();
}

/** 删除点检计划 */
async function handleDelete(row: MesDvCheckPlanApi.CheckPlan) {
  const hideLoading = ElLoading.service({ text: $t('ui.actionMessage.deleting', [row.name]) });
  try {
    await deleteCheckPlan(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading.close();
  }
}

/** 导出点检计划 */
async function handleExport() {
  const data = await exportCheckPlan(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '点检保养方案.xls', source: data });
}

/** 启用点检计划 */
async function handleEnable(row: MesDvCheckPlanApi.CheckPlan) {
  await enableCheckPlan(row.id!);
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  handleRefresh();
}

/** 停用点检计划 */
async function handleDisable(row: MesDvCheckPlanApi.CheckPlan) {
  await disableCheckPlan(row.id!);
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  handleRefresh();
}

/** 获取行操作按钮 */
function getTableActions(row: MesDvCheckPlanApi.CheckPlan): ActionItem[] {
  const actions: ActionItem[] = [];
  if (row.status === MesDvCheckPlanStatusEnum.PREPARE) {
    actions.push(
      {
        label: $t('common.edit'),
        type: 'primary',
        link: true,
        icon: ACTION_ICON.EDIT,
        auth: ['mes:dv-check-plan:update'],
        onClick: handleEdit.bind(null, row),
      },
      {
        label: $t('common.delete'),
        type: 'danger',
        link: true,
        icon: ACTION_ICON.DELETE,
        auth: ['mes:dv-check-plan:delete'],
        popConfirm: {
          title: $t('ui.actionMessage.deleteConfirm', [row.name]),
          confirm: handleDelete.bind(null, row),
        },
      },
    );
  }
  actions.push(
    row.status === MesDvCheckPlanStatusEnum.PREPARE
      ? {
          label: '启用',
          type: 'warning',
          link: true,
          auth: ['mes:dv-check-plan:update'],
          onClick: handleEnable.bind(null, row),
        }
      : {
          label: '停用',
          type: 'warning',
          link: true,
          auth: ['mes:dv-check-plan:update'],
          onClick: handleDisable.bind(null, row),
        },
  );
  return actions;
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
          await getCheckPlanPage({
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
  } as VxeTableGridOptions<MesDvCheckPlanApi.CheckPlan>,
});
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <Grid table-title="点检保养方案列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['点检保养方案']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:dv-check-plan:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:dv-check-plan:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <ElButton link type="primary" @click="handleDetail(row)">{{ row.code }}</ElButton>
      </template>
      <template #actions="{ row }">
        <TableAction :actions="getTableActions(row)" />
      </template>
    </Grid>
  </Page>
</template>
