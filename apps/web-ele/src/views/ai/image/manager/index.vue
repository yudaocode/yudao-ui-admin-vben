<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiImageApi } from '#/api/ai/image';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteImage, getImagePage, updateImage } from '#/api/ai/image';
import { $t } from '#/locales';

import Detail from '../index/modules/detail.vue';
import { useGridColumns, useGridFormSchema } from './data';

/** AI 绘图：作品管理 */
defineOptions({ name: 'AiImageManager' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看详情：管理员视角 */
function handleDetail(id: number) {
  detailModalApi.setData({ id, scope: 'admin' }).open();
}

/** 删除图片 */
async function handleDelete(row: AiImageApi.Image) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
  });
  try {
    await deleteImage(row.id);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 修改是否发布 */
async function handleUpdatePublicStatusChange(
  newStatus: boolean,
  row: AiImageApi.Image,
): Promise<boolean | undefined> {
  const text = newStatus ? '公开' : '私有';
  try {
    await confirm(`确认要将该图片切换为【${text}】吗？`);
  } catch {
    return false;
  }
  // 更新图片状态
  await updateImage({
    id: row.id,
    publicStatus: newStatus,
  });
  // 提示并返回成功
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  return true;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handleUpdatePublicStatusChange),
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
      isHover: true,
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
    <DetailModal />
    <Grid table-title="绘画管理列表">
      <template #parentId="{ row }">
        <ElButton
          v-if="row.parentId"
          type="primary"
          link
          size="small"
          @click="handleDetail(row.parentId)"
        >
          #{{ row.parentId }}
        </ElButton>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['ai:image:query'],
              onClick: handleDetail.bind(null, row.id),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
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
