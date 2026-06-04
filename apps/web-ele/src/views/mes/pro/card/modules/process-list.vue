<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProCardProcessApi } from '#/api/mes/pro/card/process';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCardProcess,
  getCardProcessPage,
} from '#/api/mes/pro/card/process';
import { $t } from '#/locales';

import { useProcessGridColumns } from '../data';
import ProcessForm from './process-form.vue';

const props = defineProps<{
  cardId: number;
  disabled?: boolean;
}>();

const editable = computed(() => !props.disabled); // 是否可维护工序记录

const [ProcessFormModal, processFormModalApi] = useVbenModal({
  connectedComponent: ProcessForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增工序记录 */
function handleCreate() {
  processFormModalApi.setData({ cardId: props.cardId }).open();
}

/** 编辑工序记录 */
function handleEdit(row: MesProCardProcessApi.CardProcess) {
  processFormModalApi.setData({ cardId: props.cardId, id: row.id }).open();
}

/** 删除工序记录 */
async function handleDelete(row: MesProCardProcessApi.CardProcess) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.processName]),
  });
  try {
    await deleteCardProcess(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.processName]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useProcessGridColumns(editable.value),
    height: 400,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.cardId) {
            return { list: [], total: 0 };
          }
          return await getCardProcessPage({
            cardId: props.cardId,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
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
  } as VxeTableGridOptions<MesProCardProcessApi.CardProcess>,
});
</script>

<template>
  <div>
    <ProcessFormModal @success="handleRefresh" />
    <Grid table-title="工序记录">
      <template v-if="editable" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['工序记录']),
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
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.processName]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
