<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { confirm, DocAlert, Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElMessage } from 'element-plus';

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
    ElMessage.success('项目已恢复');
    // 3. 刷新列表
    handleRefresh();
  } catch {
  }
}

/** 彻底删除回收站项目 */
async function handleDelete(project: PmsProjectApi.Project) {
  try {
    // 1. 删除的二次确认
    await confirm(`彻底删除后不可恢复，确认删除项目“${project.name}”吗？`);
    // 2. 彻底删除项目
    await deleteProject(project.id);
    ElMessage.success('项目已彻底删除');
    // 3. 刷新列表
    handleRefresh();
  } catch {
  }
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
      <template #recycleTime="{ row }">
        {{ formatDateTime(row.recycleTime) }}
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '恢复项目',
              type: 'primary',
              link: true,
              auth: ['pms:pm:project:update'],
              ifShow: row.adminStatus,
              onClick: handleRestore.bind(null, row),
            },
            {
              label: '彻底删除',
              type: 'danger',
              link: true,
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
