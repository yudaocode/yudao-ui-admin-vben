<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { confirm, useVbenModal } from '@vben/common-ui';
import {
  AiDramaStatusEnum,
  DICT_TYPE,
  isAiDramaRunning,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDramaProject,
  getDramaProjectPage,
  updateDramaProjectPublicStatus,
} from '#/api/ai/drama/project';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { formatDramaDuration } from '#/views/ai/utils/drama';

import {
  useProjectGridColumns,
  useProjectGridFormSchema,
} from '../project-data';
import ProjectDetail from './project-detail.vue';

/** AI 短剧制作管理：项目列表 */
defineOptions({ name: 'AiDramaProjectList' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: ProjectDetail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看详情 */
function handleDetail(row: AiDramaProjectApi.Project) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 删除项目 */
async function handleDelete(row: AiDramaProjectApi.Project) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteDramaProject(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 修改是否公开 */
async function handleUpdatePublicStatusChange(
  newStatus: boolean,
  row: AiDramaProjectApi.Project,
): Promise<boolean | undefined> {
  const text = newStatus ? '公开' : '取消公开';
  try {
    await confirm(`确认要"${text}"该项目吗?`);
  } catch {
    return false;
  }
  await updateDramaProjectPublicStatus(row.id, newStatus);
  message.success($t('ui.actionMessage.operationSuccess'));
  return true;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useProjectGridFormSchema(),
  },
  gridOptions: {
    columns: useProjectGridColumns(handleUpdatePublicStatusChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDramaProjectPage({
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
  } as VxeTableGridOptions<AiDramaProjectApi.Project>,
});
</script>

<template>
  <div class="h-full">
    <DetailModal />
    <Grid table-title="项目管理列表">
      <template #compose="{ row }">
        <a
          v-if="
            row.composeStatus === AiDramaStatusEnum.SUCCESS &&
            row.composeFileUrl
          "
          :href="row.composeFileUrl"
          target="_blank"
          class="inline-flex items-center text-primary"
        >
          <IconifyIcon icon="lucide:circle-play" class="mr-1" />
          {{ formatDramaDuration(row.composeDuration) }}
        </a>
        <DictTag
          v-else-if="row.composeStatus"
          :type="DICT_TYPE.AI_DRAMA_STATUS"
          :value="row.composeStatus"
        />
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['ai:drama:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['ai:drama:delete'],
              disabled: isAiDramaRunning(row.composeStatus),
              popConfirm: {
                title: '删除项目会一并删除剧本、资产、分镜与成片记录，是否继续？',
                disabled: isAiDramaRunning(row.composeStatus),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
