<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTaskApi } from '#/api/oa/task';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { formatDate } from '@vben/utils';

import { message, Progress, Tag } from 'ant-design-vue';

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
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteReceivedTask(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    hideLoading();
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
    <DocAlert title="【协作】日程、任务、计划与汇报" url="https://doc.iocoder.cn/oa/collaboration/work/" />
    <DetailModal @success="handleRefresh" />

    <Grid table-title="我的任务">
      <template #title="{ row }">
        <span class="cursor-pointer text-primary" @click="handleDetail(row)">
          {{ row.title }}
        </span>
        <Tag v-if="row.top" class="ml-1.5" color="red">置顶</Tag>
      </template>
      <template #statusProgress="{ row }">
        <Progress :percent="getTaskStatusProgress(row.receiverStatus)" />
      </template>
      <template #period="{ row }">
        {{ formatDate(row.startTime, 'YYYY-MM-DD') }} 至
        {{ formatDate(row.endTime, 'YYYY-MM-DD') }}
      </template>
      <template #canceledTag="{ row }">
        <Tag :color="row.canceled ? 'red' : 'green'">
          {{ row.canceled ? '已取消' : '正常' }}
        </Tag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
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
