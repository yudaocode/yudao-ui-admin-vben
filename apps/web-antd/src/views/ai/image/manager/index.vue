<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiImageApi } from '#/api/ai/image';

import { confirm, DocAlert, Page } from '@vben/common-ui';
import { AiImageStatusEnum } from '@vben/constants';

import { message, Switch } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteImage, getImagePage, updateImage } from '#/api/ai/image';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 删除 */
async function handleDelete(row: AiImageApi.Image) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteImage(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
    });
    handleRefresh();
  } finally {
    hideLoading();
  }
}
/** 修改是否发布 */
async function handleUpdatePublicStatusChange(row: AiImageApi.Image) {
  try {
    // 修改状态的二次确认
    const text = row.publicStatus ? '公开' : '私有';
    await confirm(`确认要"${text}"该图片吗?`).then(async () => {
      await updateImage({
        id: row.id,
        publicStatus: row.publicStatus,
      });
      handleRefresh();
    });
  } catch {
    row.publicStatus = !row.publicStatus;
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
          return await getImagePage({
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
  } as VxeTableGridOptions<AiImageApi.Image>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 绘图创作" url="https://doc.iocoder.cn/ai/image/" />
    </template>
    <Grid table-title="绘画管理列表">
      <template #publicStatus="{ row }">
        <Switch
          v-model:checked="row.publicStatus"
          @change="handleUpdatePublicStatusChange(row)"
          :disabled="row.status !== AiImageStatusEnum.SUCCESS"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['ai:image:delete'],
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
