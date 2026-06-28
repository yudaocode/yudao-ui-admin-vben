<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerFaceUserItemApi } from '#/api/im/manager/face/userItem';

import { Page } from '@vben/common-ui';

import { Image, message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteManagerFaceUserItem,
  getManagerFaceUserItemPage,
} from '#/api/im/manager/face/userItem';
import { $t } from '#/locales';
import { formatUserLabel } from '#/views/im/manager/utils/format';

import {
  useUserItemGridColumns,
  useUserItemGridFormSchema,
} from '../pack/data';

defineOptions({ name: 'ImManagerFaceUserItem' });

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 删除用户表情 */
async function handleDelete(row: ImManagerFaceUserItemApi.FaceUserItem) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name || row.id]),
    duration: 0,
  });
  try {
    await deleteManagerFaceUserItem(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name || row.id]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useUserItemGridFormSchema(),
  },
  gridOptions: {
    columns: useUserItemGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerFaceUserItemPage({
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
  } as VxeTableGridOptions<ImManagerFaceUserItemApi.FaceUserItem>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="用户表情列表">
      <template #image="{ row }">
        <Image v-if="row.url" :height="40" :src="row.url" :width="40" />
      </template>
      <template #user="{ row }">
        {{ formatUserLabel(row.userNickname, row.userId) }}
      </template>
      <template #size="{ row }">
        <span v-if="row.width || row.height">
          {{ row.width || '?' }} × {{ row.height || '?' }}
        </span>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['im:manager:face-user-item:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  row.name || row.id,
                ]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
