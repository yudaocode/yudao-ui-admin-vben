<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MdiCheckboxMarkedCircleOutline } from '@vben/icons';

import { ElButton, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getMyNotifyMessagePage,
  updateAllNotifyMessageRead,
  updateNotifyMessageRead,
} from '#/api/system/notify/message';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 查看站内信详情 */
function onDetail(row: SystemNotifyMessageApi.NotifyMessage) {
  detailModalApi.setData(row).open();
}

/** 标记一条站内信已读 */
async function onRead(row: SystemNotifyMessageApi.NotifyMessage) {
  const loadingInstance = ElMessage({
    message: '正在标记已读...',
    type: 'info',
    duration: 0,
  });
  // 执行标记已读操作
  await updateNotifyMessageRead([row.id]);
  // 提示成功
  loadingInstance.close();
  ElMessage.success('标记已读成功');
  onRefresh();

  // 打开详情
  onDetail(row);
}

/** 标记选中的站内信为已读 */
async function onMarkRead() {
  const rows = gridApi.grid.getCheckboxRecords();
  if (!rows || rows.length === 0) {
    ElMessage.warning('请选择需要标记的站内信');
    return;
  }

  const ids = rows.map((row: SystemNotifyMessageApi.NotifyMessage) => row.id);
  const loadingInstance = ElMessage({
    message: '正在标记已读...',
    type: 'info',
    duration: 0,
  });
  // 执行标记已读操作
  await updateNotifyMessageRead(ids);
  // 提示成功
  loadingInstance.close();
  ElMessage.success('标记已读成功');
  await gridApi.grid.setAllCheckboxRow(false);
  onRefresh();
}

/** 标记所有站内信为已读 */
async function onMarkAllRead() {
  const loadingInstance = ElMessage({
    message: '正在标记全部已读...',
    type: 'info',
    duration: 0,
  });
  // 执行标记已读操作
  await updateAllNotifyMessageRead();
  // 提示成功
  loadingInstance.close();
  ElMessage.success('全部标记已读成功');
  await gridApi.grid.setAllCheckboxRow(false);
  onRefresh();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemNotifyMessageApi.NotifyMessage>) {
  switch (code) {
    case 'detail': {
      onDetail(row);
      break;
    }
    case 'read': {
      onRead(row);
      break;
    }
  }
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
      refresh: true,
      search: true,
    },
    checkboxConfig: {
      checkMethod: (params: { row: SystemNotifyMessageApi.NotifyMessage }) =>
        !params.row.readStatus,
      highlight: true,
    },
  } as VxeTableGridOptions<SystemNotifyMessageApi.NotifyMessage>,
});
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="站内信配置" url="https://doc.iocoder.cn/notify/" />
    </template>

    <DetailModal @success="onRefresh" />
    <Grid table-title="我的站内信">
      <template #toolbar-tools>
        <ElButton type="primary" @click="onMarkRead">
          <MdiCheckboxMarkedCircleOutline />
          标记已读
        </ElButton>
        <ElButton type="primary" class="ml-2" @click="onMarkAllRead">
          <MdiCheckboxMarkedCircleOutline />
          全部已读
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
