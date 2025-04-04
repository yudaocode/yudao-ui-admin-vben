<script lang="ts" setup>
// TODO @puhui999：需要看看，vben 哪里改下哈。一个是 vben 右上角的站内信、一个是点击查看所有消息，应该跳转到这里。
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { Page, useVbenModal } from '@vben/common-ui';
import { MdiCheckboxMarkedCircleOutline } from '@vben/icons';
import { Button, message } from 'ant-design-vue';
import Detail from './modules/detail.vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getMyNotifyMessagePage,
  updateAllNotifyMessageRead,
  updateNotifyMessageRead,
} from '#/api/system/notify/message';

import { useGridColumns, useGridFormSchema } from './data';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 查看站内信详情 */
function onView(row: SystemNotifyMessageApi.SystemNotifyMessage) {
  // 标记已读
  if (!row.readStatus) {
    handleReadOne(row.id);
  }
  detailModalApi.setData(row).open();
}

/** 标记一条站内信已读 */
async function handleReadOne(id: number) {
  await updateNotifyMessageRead([id]);
  onRefresh();
}

/** 标记选中的站内信为已读 */
async function onMarkRead() {
  const rows = gridApi.grid.getCheckboxRecords();
  if (!rows || rows.length === 0) {
    message.warning({
      content: '请选择需要标记的站内信',
      key: 'action_process_msg',
    });
    return;
  }

  const ids = rows.map((row: SystemNotifyMessageApi.SystemNotifyMessage) => row.id);
  const hideLoading = message.loading({
    content: '正在标记已读...',
    duration: 0,
    key: 'action_process_msg',
  });

  try {
    await updateNotifyMessageRead(ids);
    message.success({
      content: '标记已读成功',
      key: 'action_process_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 标记所有站内信为已读 */
async function onMarkAllRead() {
  const hideLoading = message.loading({
    content: '正在标记全部已读...',
    duration: 0,
    key: 'action_process_msg',
  });

  try {
    await updateAllNotifyMessageRead();
    message.success({
      content: '全部标记已读成功',
      key: 'action_process_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemNotifyMessageApi.SystemNotifyMessage>) {
  switch (code) {
    case 'view': {
      onView(row);
      break;
    }
  }
}

// 是否允许勾选的过滤函数（只允许未读的消息被选择）
function checkboxConfig(params: { row: SystemNotifyMessageApi.SystemNotifyMessage }) {
  return !params.row.readStatus;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMyNotifyMessagePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
    checkboxConfig: {
      checkMethod: checkboxConfig,
    },
  } as VxeTableGridOptions<SystemNotifyMessageApi.SystemNotifyMessage>,
});
</script>
<template>
  <Page auto-content-height>
    <DetailModal @success="onRefresh" />
    <Grid table-title="我的站内信">
      <template #toolbar-tools>
        <Button type="primary" @click="onMarkRead">
          <MdiCheckboxMarkedCircleOutline />
          标记已读
        </Button>
        <Button type="primary" class="ml-2" @click="onMarkAllRead">
          <MdiCheckboxMarkedCircleOutline />
          全部已读
        </Button>
      </template>
    </Grid>
  </Page>
</template>
