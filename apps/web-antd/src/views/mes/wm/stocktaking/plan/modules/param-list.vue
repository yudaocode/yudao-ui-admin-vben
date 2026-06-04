<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmStockTakingPlanParamApi } from '#/api/mes/wm/stocktaking/plan/param';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteStockTakingPlanParam,
  getStockTakingPlanParamPage,
} from '#/api/mes/wm/stocktaking/plan/param';
import { $t } from '#/locales';

import { useParamGridColumns } from '../data';
import ParamForm from './param-form.vue';

const props = defineProps<{
  disabled: boolean; // 是否只读（详情态）
  planId: number; // 所属方案编号
}>();

const [ParamFormModal, paramFormModalApi] = useVbenModal({
  connectedComponent: ParamForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 添加条件 */
function handleCreate() {
  paramFormModalApi.setData({ planId: props.planId }).open();
}

/** 编辑条件 */
function handleEdit(row: MesWmStockTakingPlanParamApi.StockTakingPlanParam) {
  paramFormModalApi.setData({ id: row.id, planId: props.planId }).open();
}

/** 删除条件 */
async function handleDelete(
  row: MesWmStockTakingPlanParamApi.StockTakingPlanParam,
) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.valueName]),
    duration: 0,
  });
  try {
    await deleteStockTakingPlanParam(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.valueName]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useParamGridColumns(!props.disabled),
    height: 320,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.planId) {
            return { list: [], total: 0 };
          }
          return await getStockTakingPlanParamPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            planId: props.planId,
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
  } as VxeTableGridOptions<MesWmStockTakingPlanParamApi.StockTakingPlanParam>,
});
</script>

<template>
  <div>
    <ParamFormModal @success="handleRefresh" />
    <Grid table-title="盘点参数">
      <template v-if="!disabled" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '添加条件',
              type: 'primary',
              icon: ACTION_ICON.ADD,
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
                title: $t('ui.actionMessage.deleteConfirm', [row.valueName]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
