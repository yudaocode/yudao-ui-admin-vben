<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiVideoApi } from '#/api/ai/video';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { AiVideoStatusEnum, isAiVideoRunning } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { ElLink, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteVideo, getVideoPage, updateVideo } from '#/api/ai/video';
import { $t } from '#/locales';

import Detail from '../index/modules/detail.vue';
import { useGridColumns, useGridFormSchema } from './data';

/** AI 视频：视频生成管理 */
defineOptions({ name: 'AiVideoManager' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看详情：管理员视角 */
function handleDetail(row: AiVideoApi.Video) {
  detailModalApi.setData({ id: row.id, scope: 'admin' }).open();
}

/** 删除视频 */
async function handleDelete(row: AiVideoApi.Video) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
  });
  try {
    await deleteVideo(row.id);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 修改是否公开 */
async function handleUpdatePublicStatusChange(
  newStatus: boolean,
  row: AiVideoApi.Video,
): Promise<boolean | undefined> {
  const text = newStatus ? '公开' : '取消公开';
  try {
    await confirm(`确认要"${text}"该视频吗?`);
  } catch {
    return false;
  }
  await updateVideo({ id: row.id, publicStatus: newStatus });
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
          return await getVideoPage({
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
  } as VxeTableGridOptions<AiVideoApi.Video>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 视频生成" url="https://doc.iocoder.cn/ai/video/" />
    </template>
    <DetailModal />
    <Grid table-title="视频生成管理列表">
      <template #videoUrl="{ row }">
        <ElLink
          v-if="row.status === AiVideoStatusEnum.SUCCESS && row.videoUrl"
          type="primary"
          :href="row.videoUrl"
          target="_blank"
        >
          <IconifyIcon icon="ep:video-play" class="mr-1" />
          播放
        </ElLink>
        <span v-else>-</span>
      </template>
      <template #errorMessage="{ row }">
        <span
          v-if="row.status === AiVideoStatusEnum.FAIL"
          class="text-[var(--el-color-danger)]"
        >
          {{ row.errorMessage || '-' }}
        </span>
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
              auth: ['ai:video:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['ai:video:delete'],
              disabled: isAiVideoRunning(row.status),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                disabled: isAiVideoRunning(row.status),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
