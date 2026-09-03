<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { DocAlert, Page } from '@vben/common-ui';

import { message } from 'antdv-next';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProjectPage, restoreProject } from '#/api/pms/pm/project';
import {
  PmsProjectSceneType,
  PmsProjectSortType,
  PmsProjectStatus,
} from '#/views/pms/pm/utils/constants';

import { useGridColumns } from './data';

defineOptions({ name: 'PmsProjectArchive' });

// TODO @AI：恢复操作对齐 system user，用 TableAction popConfirm，不要 confirm + empty catch。归档列表是否也要搜索 form schema？补 toolbarConfig。
/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 恢复归档项目 */
async function handleRestore(project: PmsProjectApi.Project) {
  await restoreProject(project.id);
  message.success('项目已恢复');
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
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
    <template #doc>
      <DocAlert title="【PMS】项目中心、工作台与项目管理" url="https://doc.iocoder.cn/pms/pm/project/" />
    </template>
    <!-- 归档项目列表 -->
    <Grid>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              label: '恢复项目',
              type: 'link',
              auth: ['pms:pm:project:update'],
              ifShow: () => row.adminStatus,
              popConfirm: {
                title: `确认恢复项目“${row.name}”吗？`,
                confirm: handleRestore.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
