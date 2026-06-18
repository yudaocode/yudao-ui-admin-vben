<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerGroupRequestVO } from '#/api/im/manager/group/request';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getManagerGroupRequestPage } from '#/api/im/manager/group/request';
import {
  formatGroupLabel,
  formatUserLabel,
} from '#/views/im/manager/utils/format';

import {
  useGroupRequestGridColumns,
  useGroupRequestGridFormSchema,
} from '../data';

defineOptions({ name: 'ImManagerGroupRequest' });

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useGroupRequestGridFormSchema(),
  },
  gridOptions: {
    columns: useGroupRequestGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerGroupRequestPage({
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
  } as VxeTableGridOptions<ImManagerGroupRequestVO>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="加群申请列表">
      <template #group="{ row }">
        {{ formatGroupLabel(row.groupName, row.groupId) }}
      </template>
      <template #user="{ row }">
        {{ formatUserLabel(row.userNickname, row.userId) }}
      </template>
      <template #inviter="{ row }">
        <template v-if="row.inviterUserId">
          {{ formatUserLabel(row.inviterNickname, row.inviterUserId) }}
        </template>
        <span v-else>主动申请</span>
      </template>
      <template #handler="{ row }">
        <template v-if="row.handleUserId">
          {{ formatUserLabel(row.handleNickname, row.handleUserId) }}
        </template>
        <span v-else>-</span>
      </template>
    </Grid>
  </Page>
</template>
