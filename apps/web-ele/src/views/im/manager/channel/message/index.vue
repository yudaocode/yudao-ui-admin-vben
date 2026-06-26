<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerChannelMessageApi } from '#/api/im/manager/channel/message';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElImage, ElLoading, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteManagerChannelMessage,
  getManagerChannelMessagePage,
} from '#/api/im/manager/channel/message';
import { $t } from '#/locales';

import {
  useMessageGridColumns,
  useMessageGridFormSchema,
} from '../material/data';
import SendForm from './modules/send-form.vue';

defineOptions({ name: 'ImManagerChannelMessage' });

const [SendModal, sendModalApi] = useVbenModal({
  connectedComponent: SendForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 打开发送弹窗 */
function handleSend() {
  sendModalApi.open();
}

/** 删除频道消息 */
async function handleDelete(row: ImManagerChannelMessageApi.ChannelMessage) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
  });
  try {
    await deleteManagerChannelMessage(row.id);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useMessageGridFormSchema(),
  },
  gridOptions: {
    columns: useMessageGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerChannelMessagePage({
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
  } as VxeTableGridOptions<ImManagerChannelMessageApi.ChannelMessage>,
});
</script>

<template>
  <Page auto-content-height>
    <SendModal @success="handleRefresh" />
    <Grid table-title="频道消息列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '立即推送',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['im:manager:channel-message:send'],
              onClick: handleSend,
            },
          ]"
        />
      </template>
      <template #cover="{ row }">
        <ElImage
          v-if="row.materialCoverUrl"
          :height="40"
          :src="row.materialCoverUrl"
          :width="40"
        />
      </template>
      <template #receivers="{ row }">
        <ElTag
          v-if="!row.receiverUserIds || row.receiverUserIds.length === 0"
          type="warning"
        >
          全员
        </ElTag>
        <span v-else>{{ row.receiverUserIds.length }} 人</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.delete'),
              link: true,
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['im:manager:channel-message:delete'],
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
