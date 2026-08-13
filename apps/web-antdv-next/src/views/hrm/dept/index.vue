<script lang="ts" setup>
import type { HrmDeptRow } from './data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';

import { Alert, Button } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';

import { getHrmDeptList, useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'HrmDept' });

const router = useRouter();

/** 新建部门 */
function openDeptManagement() {
  router.push('/system/dept');
}

/** 打开组织详情 */
function openDetail(id?: number) {
  if (id === undefined) {
    return;
  }
  router.push({ name: 'HrmDeptDetail', params: { id } });
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params, formValues) => {
          return await getHrmDeptList(formValues);
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
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
      expandAll: true,
      reserve: true,
    },
  } as VxeTableGridOptions<HrmDeptRow>,
});
</script>

<template>
  <Page auto-content-height content-class="flex flex-col overflow-hidden">
    <template #doc>
      <DocAlert
        title="【组织】工作台、组织架构"
        url="https://doc.iocoder.cn/hrm/organization/"
      />
    </template>
    <Alert
      class="mb-4 shrink-0"
      :closable="false"
      show-icon
      message="人数格式为：直属人数（包含下级部门人数）"
      type="info"
    />
    <Grid class="min-h-0 flex-1" table-title="组织列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新建部门',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:dept:create'],
              onClick: openDeptManagement,
            },
          ]"
        />
      </template>
      <template #name="{ row }">
        <Button type="link" @click="openDetail(row.id)">
          {{ row.name }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
