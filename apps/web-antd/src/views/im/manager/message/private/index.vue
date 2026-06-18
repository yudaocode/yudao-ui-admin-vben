<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerPrivateMessageVO } from '#/api/im/manager/message/private';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getManagerPrivateMessagePage } from '#/api/im/manager/message/private';
import { formatUserLabel } from '#/views/im/manager/utils/format';
import { MESSAGE_PRIVATE_READ_ENABLED } from '#/views/im/utils/config';

import {
  usePrivateGridColumns,
  usePrivateGridFormSchema,
} from '../data';
import MessageContentPreview from '../MessageContentPreview.vue';
import Detail from './modules/detail.vue';

defineOptions({ name: 'ImPrivateMessage' });

const route = useRoute();
const detailRef = ref<InstanceType<typeof Detail>>();

/** 打开详情 */
function handleDetail(row: ImManagerPrivateMessageVO) {
  detailRef.value?.open(row);
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: usePrivateGridFormSchema(),
  },
  gridOptions: {
    columns: usePrivateGridColumns(MESSAGE_PRIVATE_READ_ENABLED),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerPrivateMessagePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            senderId: route.query.senderId
              ? Number(route.query.senderId)
              : undefined,
            receiverId: route.query.receiverId
              ? Number(route.query.receiverId)
              : undefined,
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
  } as VxeTableGridOptions<ImManagerPrivateMessageVO>,
});
</script>

<template>
  <Page auto-content-height>
    <Detail ref="detailRef" />
    <Grid table-title="私聊消息列表">
      <template #sender="{ row }">
        {{ formatUserLabel(row.senderNickname, row.senderId) }}
      </template>
      <template #receiver="{ row }">
        {{ formatUserLabel(row.receiverNickname, row.receiverId) }}
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
