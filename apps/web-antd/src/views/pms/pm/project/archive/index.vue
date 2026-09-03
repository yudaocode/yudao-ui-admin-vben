<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { confirm, Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProjectPage, restoreProject } from '#/api/pms/pm/project';
import {
  PmsProjectSceneType,
  PmsProjectSortType,
  PmsProjectStatus,
} from '#/views/pms/pm/utils/constants';

import { useGridColumns } from './data';

defineOptions({ name: 'PmsProjectArchive' });

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 恢复归档项目 */
async function handleRestore(project: PmsProjectApi.Project) {
  try {
    // 1. 恢复的二次确认
    await confirm(`确认恢复项目“${project.name}”吗？`);
    // 2. 恢复项目
    await restoreProject(project.id);
    message.success('项目已恢复');
    // 3. 刷新列表
    handleRefresh();
  } catch {
    /* 取消恢复 */
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: {
      enabled: true,
      pageSize: 10,
      pageSizes: [10, 20, 30, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getProjectPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            name: '',
            sceneType: PmsProjectSceneType.ALL,
            status: PmsProjectStatus.ARCHIVED,
            sortType: PmsProjectSortType.ACCESS_TIME,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
  } as VxeTableGridOptions<PmsProjectApi.Project>,
});
</script>

<template>
  <Page auto-content-height>
    <!-- 归档项目列表 -->
    <Grid>
      <template #archiveTime="{ row }">
        {{ formatDateTime(row.archiveTime) }}
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              label: '恢复项目',
              type: 'link',
              auth: ['pms:pm:project:update'],
              ifShow: () => row.adminStatus,
              onClick: handleRestore.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
