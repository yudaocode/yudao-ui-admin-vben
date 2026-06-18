<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerGroupMessageApi } from '#/api/im/manager/message/group';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getManagerGroupMessagePage } from '#/api/im/manager/message/group';
import {
  formatGroupLabel,
  formatUserLabel,
} from '#/views/im/manager/utils/format';
import { MESSAGE_GROUP_READ_ENABLED } from '#/views/im/utils/config';
import {
  IM_AT_ALL_NICKNAME,
  IM_AT_ALL_USER_ID,
} from '#/views/im/utils/constants';

import { MessageContentPreview } from '..';
import { useGroupGridColumns, useGroupGridFormSchema } from '../data';
import Detail from './modules/detail.vue';

defineOptions({ name: 'ImGroupMessage' });

const route = useRoute();
const detailRef = ref<InstanceType<typeof Detail>>();

/** 打开详情 */
function handleDetail(row: ImManagerGroupMessageApi.GroupMessage) {
  detailRef.value?.open(row);
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useGroupGridFormSchema(),
  },
  gridOptions: {
    columns: useGroupGridColumns(MESSAGE_GROUP_READ_ENABLED),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerGroupMessagePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            groupId: route.query.groupId ? Number(route.query.groupId) : undefined,
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
  } as VxeTableGridOptions<ImManagerGroupMessageApi.GroupMessage>,
});
</script>

<template>
  <Page auto-content-height>
    <Detail ref="detailRef" />
    <Grid table-title="群聊消息列表">
      <template #group="{ row }">
        {{ formatGroupLabel(row.groupName, row.groupId) }}
      </template>
      <template #sender="{ row }">
        {{ formatUserLabel(row.senderNickname, row.senderId) }}
      </template>
      <template #atUsers="{ row }">
        <template v-if="row.atUserIds?.length">
          <span v-for="(userId, index) in row.atUserIds" :key="userId">
            <span v-if="index > 0">、</span>
            <template v-if="userId === IM_AT_ALL_USER_ID">@{{ IM_AT_ALL_NICKNAME }}</template>
            <template v-else>@{{ row.atUserNicknames?.[index] || userId }}</template>
          </span>
        </template>
        <span v-else>-</span>
      </template>
      <template #content="{ row }">
        <MessageContentPreview
          :content="row.content"
          :sender-nickname="row.senderNickname"
          :type="row.type"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['im:manager:message:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
