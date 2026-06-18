<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerFriendRequestVO } from '#/api/im/manager/friend/request';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getManagerFriendRequestPage } from '#/api/im/manager/friend/request';
import { formatUserLabel } from '#/views/im/manager/utils/format';

import {
  useFriendRequestGridColumns,
  useFriendRequestGridFormSchema,
} from '../data';

defineOptions({ name: 'ImManagerFriendRequest' });

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useFriendRequestGridFormSchema(),
  },
  gridOptions: {
    columns: useFriendRequestGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerFriendRequestPage({
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
  } as VxeTableGridOptions<ImManagerFriendRequestVO>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="好友申请列表">
      <template #fromUser="{ row }">
        {{ formatUserLabel(row.fromNickname, row.fromUserId) }}
      </template>
      <template #toUser="{ row }">
        {{ formatUserLabel(row.toNickname, row.toUserId) }}
      </template>
    </Grid>
  </Page>
</template>
