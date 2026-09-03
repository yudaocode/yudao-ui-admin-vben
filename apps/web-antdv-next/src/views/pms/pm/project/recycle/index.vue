<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { DocAlert, Page } from '@vben/common-ui';

import { message } from 'antdv-next';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProject,
  getProjectPage,
  restoreProject,
} from '#/api/pms/pm/project';
import {
  PmsProjectSceneType,
  PmsProjectSortType,
  PmsProjectStatus,
} from '#/views/pms/pm/utils/constants';

import { useGridColumns, useSearchFormSchema } from './data';

defineOptions({ name: 'PmsProjectRecycle' });

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 恢复回收站项目 */
async function handleRestore(project: PmsProjectApi.Project) {
  await restoreProject(project.id);
  message.success('项目已恢复');
  handleRefresh();
}

/** 彻底删除回收站项目 */
async function handleDelete(project: PmsProjectApi.Project) {
  await deleteProject(project.id);
  message.success('项目已彻底删除');
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSearchFormSchema(),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getProjectPage({
            ...formValues,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            sceneType: PmsProjectSceneType.ALL,
            status: PmsProjectStatus.RECYCLED,
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
    <!-- 回收站项目列表 -->
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '恢复项目',
              type: 'link',
              auth: ['pms:pm:project:update'],
              ifShow: row.adminStatus,
              popConfirm: {
                title: `确认恢复项目“${row.name}”吗？`,
                confirm: handleRestore.bind(null, row),
              },
            },
            {
              label: '彻底删除',
              type: 'link',
              danger: true,
              auth: ['pms:pm:project:delete'],
              ifShow: row.ownerStatus,
              popConfirm: {
                title: `彻底删除后不可恢复，确认删除项目“${row.name}”吗？`,
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
