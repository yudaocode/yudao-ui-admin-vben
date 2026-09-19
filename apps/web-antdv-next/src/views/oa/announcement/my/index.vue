<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaAnnouncementApi } from '#/api/oa/announcement';

import { ref } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';

import { message, Tag } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteReceivedAnnouncement,
  forwardAnnouncement,
  getReceivedAnnouncementPage,
} from '#/api/oa/announcement';
import { $t } from '#/locales';

import Detail from '../list/modules/detail.vue';
import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'OaAnnouncementMy' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看公告详情，并同步阅读状态 */
function handleDetail(row: OaAnnouncementApi.Announcement) {
  detailModalApi.setData({ id: row.id, markAsRead: true }).open();
}

/** 标记列表中的公告为已读 */
function handleRead(id: number) {
  const rows = gridApi.grid?.getTableData()?.fullData ?? [];
  const row = rows.find(
    (item: OaAnnouncementApi.Announcement) => item.id === id,
  );
  if (row) {
    row.readStatus = true;
  }
}

const forwardingIds = ref<number[]>([]); // 正在确认或提交转发的公告编号

/** 转发公告给直属下属 */
async function handleForward(row: OaAnnouncementApi.Announcement) {
  if (!row.id || row.forwarded || forwardingIds.value.includes(row.id)) {
    return;
  }
  forwardingIds.value.push(row.id);
  try {
    // 转发的二次确认
    await confirm('确定将该公告转发给自己的下属吗？');
    // 发起转发
    const count = await forwardAnnouncement(row.id);
    // 更新当前公告的转发状态
    if (count > 0) {
      message.success(`已转发给 ${count} 位下属`);
      row.forwarded = true;
    } else {
      message.info('暂无可转发的下属');
    }
  } catch {
    // 取消或请求失败后刷新，同步其他页面已完成的转发状态
    handleRefresh();
  } finally {
    forwardingIds.value = forwardingIds.value.filter((id) => id !== row.id);
  }
}

/** 删除接收的公告 */
async function handleDelete(row: OaAnnouncementApi.Announcement) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteReceivedAnnouncement(row.id!);
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
          return await getReceivedAnnouncementPage({
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
  } as VxeTableGridOptions<OaAnnouncementApi.Announcement>,
});
</script>

<template>
  <Page auto-content-height>
    <DetailModal @read="handleRead" />

    <Grid table-title="公告列表">
      <template #topTag="{ row }">
        <Tag v-if="row.top" color="red">置顶</Tag>
        <span v-else>-</span>
      </template>
      <template #title="{ row }">
        <span
          class="cursor-pointer text-primary"
          :class="!row.readStatus ? 'font-bold' : ''"
          @click="handleDetail(row)"
        >
          {{ row.title }}
        </span>
      </template>
      <template #readStatus="{ row }">
        <Tag :color="row.readStatus ? 'success' : 'warning'">
          {{ row.readStatus ? '已读' : '未读' }}
        </Tag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '转发',
              type: 'link',
              ifShow: !row.forwarded,
              disabled: !!row.id && forwardingIds.includes(row.id),
              onClick: handleForward.bind(null, row),
            },
            {
              label: '已转发',
              type: 'link',
              disabled: true,
              ifShow: row.forwarded,
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              ifShow: row.readStatus,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
