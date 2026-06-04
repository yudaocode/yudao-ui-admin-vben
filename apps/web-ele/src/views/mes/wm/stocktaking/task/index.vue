<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmStockTakingTaskApi } from '#/api/mes/wm/stocktaking/task';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmStockTakingTaskStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelStockTaking,
  deleteStockTaking,
  exportStockTaking,
  getStockTakingPage,
} from '#/api/mes/wm/stocktaking/task';
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

/** 创建盘点任务 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看盘点任务 */
function handleDetail(row: MesWmStockTakingTaskApi.StockTakingTask) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑盘点任务 */
function handleEdit(row: MesWmStockTakingTaskApi.StockTakingTask) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 提交盘点任务 */
function handleSubmit(row: MesWmStockTakingTaskApi.StockTakingTask) {
  formModalApi.setData({ formType: 'submit', id: row.id }).open();
}

/** 执行盘点 */
function handleExecute(row: MesWmStockTakingTaskApi.StockTakingTask) {
  formModalApi.setData({ formType: 'execute', id: row.id }).open();
}

/** 取消盘点任务 */
async function handleCancel(row: MesWmStockTakingTaskApi.StockTakingTask) {
  await cancelStockTaking(row.id!);
  ElMessage.success('取消成功');
  handleRefresh();
}

/** 删除盘点任务 */
async function handleDelete(row: MesWmStockTakingTaskApi.StockTakingTask) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.code]),
  });
  try {
    await deleteStockTaking(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 导出表格 */
async function handleExport() {
  const data = await exportStockTaking(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '盘点任务.xls', source: data });
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
          return await getStockTakingPage({
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
  } as VxeTableGridOptions<MesWmStockTakingTaskApi.StockTakingTask>,
});

const StatusEnum = MesWmStockTakingTaskStatusEnum;
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

    <Grid table-title="盘点任务列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['盘点任务']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-stock-taking-task:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-stock-taking-task:export'],
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
              auth: ['mes:wm-stock-taking-task:update'],
              ifShow: row.status === StatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '提交',
              type: 'primary',
              link: true,
              auth: ['mes:wm-stock-taking-task:update'],
              ifShow: row.status === StatusEnum.PREPARE,
              onClick: handleSubmit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-stock-taking-task:delete'],
              ifShow: row.status === StatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行盘点',
              type: 'primary',
              link: true,
              auth: ['mes:wm-stock-taking-task:update'],
              ifShow: row.status === StatusEnum.APPROVING,
              onClick: handleExecute.bind(null, row),
            },
            {
              label: '取消',
              type: 'danger',
              link: true,
              auth: ['mes:wm-stock-taking-task:update'],
              ifShow: row.status === StatusEnum.APPROVING,
              popConfirm: {
                title: '确认取消该盘点任务？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
