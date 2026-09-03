<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { confirm, Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { message } from 'ant-design-vue';

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

/** 彻底删除回收站项目 */
async function handleDelete(project: PmsProjectApi.Project) {
  try {
    // 1. 删除的二次确认
    await confirm(`彻底删除后不可恢复，确认删除项目“${project.name}”吗？`);
    // 2. 彻底删除项目
    await deleteProject(project.id);
    message.success('项目已彻底删除');
    // 3. 刷新列表
    handleRefresh();
  } catch {
    /* 取消删除 */
  }
}

// TODO @AI：检查下，哪些 Grid 属性是多余的，类似 pagerConfig 整个？还有其他的也看看；另外是整个 pms 模块都要看噢；
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSearchFormSchema(),
    submitOnEnter: true,
  },
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
    <!-- 回收站项目列表 -->
    <Grid>
      <template #recycleTime="{ row }">
        {{ formatDateTime(row.recycleTime) }}
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '恢复项目',
              type: 'link',
              auth: ['pms:pm:project:update'],
              ifShow: row.adminStatus,
              onClick: handleRestore.bind(null, row),
            },
            {
              label: '彻底删除',
              type: 'link',
              danger: true,
              auth: ['pms:pm:project:delete'],
              ifShow: row.ownerStatus,
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
