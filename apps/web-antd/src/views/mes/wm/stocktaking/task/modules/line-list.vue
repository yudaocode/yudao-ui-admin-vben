<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';
import type { MesWmStockTakingTaskLineApi } from '#/api/mes/wm/stocktaking/task/line';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createStockTakingTaskLine,
  deleteStockTakingTaskLine,
  getStockTakingTaskLinePage,
} from '#/api/mes/wm/stocktaking/task/line';
import { $t } from '#/locales';
import { WmMaterialStockSelectDialog } from '#/views/mes/wm/materialstock/components';

import { type FormType, useLineGridColumns } from '../data';

const props = defineProps<{
  formType: FormType;
  taskId: number;
}>();

const isEditable = computed(() => props.formType === 'update'); // 仅编辑态可维护盘点清单
const dialogRef = ref<InstanceType<typeof WmMaterialStockSelectDialog>>();

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 打开库存选择弹窗批量添加物料 */
function handleAdd() {
  dialogRef.value?.open([], { multiple: true });
}

/** 库存选择确认回调：将选中的库存记录批量创建为盘点行 */
async function handleStockSelected(rows: MesWmMaterialStockApi.MaterialStock[]) {
  if (rows.length === 0) {
    return;
  }
  for (const stock of rows) {
    await createStockTakingTaskLine({
      areaId: stock.areaId,
      batchId: stock.batchId,
      itemId: stock.itemId,
      locationId: stock.locationId,
      materialStockId: stock.id,
      quantity: stock.quantity,
      taskId: props.taskId,
      warehouseId: stock.warehouseId,
    });
  }
  message.success(`成功添加 ${rows.length} 条盘点行`);
  handleRefresh();
}

/** 删除盘点行 */
async function handleDelete(
  row: MesWmStockTakingTaskLineApi.StockTakingTaskLine,
) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.itemName]),
    duration: 0,
  });
  try {
    await deleteStockTakingTaskLine(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useLineGridColumns(isEditable.value),
    height: 360,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.taskId) {
            return { list: [], total: 0 };
          }
          return await getStockTakingTaskLinePage({
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
  } as VxeTableGridOptions<MesWmStockTakingTaskLineApi.StockTakingTaskLine>,
});

defineExpose({ refresh: handleRefresh });
</script>

<template>
  <div>
    <WmMaterialStockSelectDialog
      ref="dialogRef"
      @selected="handleStockSelected"
    />
    <Grid table-title="盘点清单">
      <template v-if="isEditable" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '添加物料',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-stock-taking-task:update'],
              onClick: handleAdd,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
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
