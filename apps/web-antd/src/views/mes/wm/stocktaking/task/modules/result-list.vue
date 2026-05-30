<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmStockTakingResultApi } from '#/api/mes/wm/stocktaking/task/result';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteStockTakingResult,
  getStockTakingResultPage,
} from '#/api/mes/wm/stocktaking/task/result';
import { $t } from '#/locales';

import { useResultGridColumns } from '../data';
import ResultForm from './result-form.vue';

const props = defineProps<{
  formType: 'detail' | 'execute';
  taskId: number;
}>();

const isExecute = computed(() => props.formType === 'execute'); // 执行盘点态可维护盘点结果

const [ResultFormModal, resultFormModalApi] = useVbenModal({
  connectedComponent: ResultForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增盘点结果 */
function handleCreate() {
  resultFormModalApi
    .setData({ execute: true, taskId: props.taskId })
    .open();
}

/** 编辑盘点结果 */
function handleEdit(row: MesWmStockTakingResultApi.StockTakingResult) {
  resultFormModalApi.setData({ id: row.id, taskId: props.taskId }).open();
}

/** 删除盘点结果 */
async function handleDelete(
  row: MesWmStockTakingResultApi.StockTakingResult,
) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.itemName]),
    duration: 0,
  });
  try {
    await deleteStockTakingResult(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useResultGridColumns(isExecute.value),
    height: 360,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.taskId) {
            return { list: [], total: 0 };
          }
          return await getStockTakingResultPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            taskId: props.taskId,
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
    },
  } as VxeTableGridOptions<MesWmStockTakingResultApi.StockTakingResult>,
});

defineExpose({ refresh: handleRefresh });
</script>

<template>
  <div>
    <ResultFormModal @success="handleRefresh" />
    <Grid table-title="盘点结果">
      <template v-if="isExecute" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('common.create'),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-stock-taking-task:update'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.itemName]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
