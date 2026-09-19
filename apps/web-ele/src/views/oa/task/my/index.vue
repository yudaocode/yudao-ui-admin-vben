<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTaskApi } from '#/api/oa/task';

import { Page, useVbenModal } from '@vben/common-ui';
import { formatDate } from '@vben/utils';

import { ElLoading, ElMessage, ElProgress, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteReceivedTask, getReceivedTaskPage } from '#/api/oa/task';
import { $t } from '#/locales';
import { getTaskStatusProgress } from '#/views/oa/utils/format';

import Detail from '../list/modules/detail.vue';
import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'OaTaskMy' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看任务详情 */
function handleDetail(row: OaTaskApi.Task) {
  detailModalApi.setData({ id: row.id, mode: 'received' }).open();
}

/** 删除接收的任务 */
async function handleDelete(row: OaTaskApi.Task) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
  });
  try {
    await deleteReceivedTask(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
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
          return await getReceivedTaskPage({
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
  } as VxeTableGridOptions<OaTaskApi.Task>,
});
</script>

<template>
  <Page auto-content-height>
    <DetailModal @success="handleRefresh" />

    <Grid table-title="我的任务">
      <template #title="{ row }">
        <span class="cursor-pointer text-primary" @click="handleDetail(row)">
          {{ row.title }}
        </span>
        <ElTag v-if="row.top" class="ml-1.5" size="small" type="danger">
          置顶
        </ElTag>
      </template>
      <template #statusProgress="{ row }">
        <ElProgress :percentage="getTaskStatusProgress(row.receiverStatus)" />
      </template>
      <template #period="{ row }">
        {{ formatDate(row.startTime, 'YYYY-MM-DD') }} 至
        {{ formatDate(row.endTime, 'YYYY-MM-DD') }}
      </template>
      <template #canceledTag="{ row }">
        <ElTag :type="row.canceled ? 'danger' : 'success'">
          {{ row.canceled ? '已取消' : '正常' }}
        </ElTag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              ifShow: row.canceled,
              popConfirm: {
                title:
                  '确认从“我的任务”中删除该任务吗？该操作不会影响其他接收人。',
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
