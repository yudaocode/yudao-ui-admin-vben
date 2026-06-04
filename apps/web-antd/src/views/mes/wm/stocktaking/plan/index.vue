<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmStockTakingPlanApi } from '#/api/mes/wm/stocktaking/plan';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteStockTakingPlan,
  exportStockTakingPlan,
  getStockTakingPlanPage,
  updateStockTakingPlanStatus,
} from '#/api/mes/wm/stocktaking/plan';
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

/** 创建盘点方案 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看盘点方案 */
function handleDetail(row: MesWmStockTakingPlanApi.StockTakingPlan) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑盘点方案 */
function handleEdit(row: MesWmStockTakingPlanApi.StockTakingPlan) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 更新盘点方案状态 */
async function handleStatusChange(
  newStatus: number,
  row: MesWmStockTakingPlanApi.StockTakingPlan,
): Promise<boolean | undefined> {
  try {
    await confirm(
      `确认要${newStatus === CommonStatusEnum.ENABLE ? '启用' : '停用'}"${row.name}"盘点方案吗？`,
    );
  } catch {
    return false;
  }
  await updateStockTakingPlanStatus(row.id!, newStatus);
  message.success($t('ui.actionMessage.operationSuccess'));
  return true;
}

/** 删除盘点方案 */
async function handleDelete(row: MesWmStockTakingPlanApi.StockTakingPlan) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteStockTakingPlan(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出表格 */
async function handleExport() {
  const data = await exportStockTakingPlan(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '盘点方案.xls', source: data });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handleStatusChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getStockTakingPlanPage({
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
  } as VxeTableGridOptions<MesWmStockTakingPlanApi.StockTakingPlan>,
});

const StatusEnum = CommonStatusEnum;
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】库存盘点"
        url="https://doc.iocoder.cn/mes/wm/stocktaking/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="盘点方案列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['盘点方案']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-stock-taking-plan:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-stock-taking-plan:export'],
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
              auth: ['mes:wm-stock-taking-plan:update'],
              disabled: row.status !== StatusEnum.DISABLE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-stock-taking-plan:delete'],
              disabled: row.status !== StatusEnum.DISABLE,
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
