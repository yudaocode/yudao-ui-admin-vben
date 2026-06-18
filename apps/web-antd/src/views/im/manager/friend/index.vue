<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerFriendApi } from '#/api/im/manager/friend';

import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getManagerFriendPage } from '#/api/im/manager/friend';
import { formatUserLabel } from '#/views/im/manager/utils/format';

import { useFriendGridColumns, useFriendGridFormSchema } from './data';

defineOptions({ name: 'ImManagerFriend' });

const router = useRouter();

/** 查看私聊消息 */
function handleConversation(row: ImManagerFriendApi.Friend) {
  router.push({
    name: 'ImPrivateMessage',
    query: {
      senderId: row.userId,
      receiverId: row.friendUserId,
    },
  });
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useFriendGridFormSchema(),
  },
  gridOptions: {
    columns: useFriendGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerFriendPage({
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
  } as VxeTableGridOptions<ImManagerFriendApi.Friend>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="好友关系列表">
      <template #user="{ row }">
        {{ formatUserLabel(row.userNickname, row.userId) }}
      </template>
      <template #friend="{ row }">
        {{ formatUserLabel(row.friendNickname, row.friendUserId) }}
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '查看对话',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: handleConversation.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
