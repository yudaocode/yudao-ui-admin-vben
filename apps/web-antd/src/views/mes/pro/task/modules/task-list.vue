<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProTaskApi } from '#/api/mes/pro/task';

import { computed, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTask, getTaskPage } from '#/api/mes/pro/task';
import { $t } from '#/locales';

import { useTaskGridColumns } from '../data';
import TaskForm from './task-form.vue';

const props = defineProps<{
  colorCode?: string;
  disabled?: boolean;
  itemId?: number;
  processId: number;
  routeId: number;
  workOrderId: number;
}>();

const editable = computed(() => !props.disabled); // 是否可维护任务

const [TaskFormModal, taskFormModalApi] = useVbenModal({
  connectedComponent: TaskForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增任务 */
function handleCreate() {
  taskFormModalApi
    .setData({
      colorCode: props.colorCode,
      itemId: props.itemId,
      processId: props.processId,
      routeId: props.routeId,
      workOrderId: props.workOrderId,
    })
    .open();
}

/** 编辑任务 */
function handleEdit(row: MesProTaskApi.Task) {
  taskFormModalApi.setData({ id: row.id }).open();
}

/** 删除任务 */
async function handleDelete(row: MesProTaskApi.Task) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteTask(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useTaskGridColumns(editable.value),
    height: 360,
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!props.workOrderId) {
            return { list: [], total: 0 };
          }
          return await getTaskPage({
            pageNo: 1,
            pageSize: 100,
            processId: props.processId,
            routeId: props.routeId,
            workOrderId: props.workOrderId,
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
  } as VxeTableGridOptions<MesProTaskApi.Task>,
});

// 工序步骤切换时重新加载当前工序的任务
watch(
  () => props.processId,
  () => handleRefresh(),
);
</script>

<template>
  <div>
    <TaskFormModal @success="handleRefresh" />
    <Grid table-title="生产任务">
      <template v-if="editable" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增任务',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:pro-task:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #colorCode="{ row }">
        <div
          class="mx-auto size-5 rounded"
          :style="{ background: row.colorCode || '#00AEF3' }"
        ></div>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mes:pro-task:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:pro-task:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
