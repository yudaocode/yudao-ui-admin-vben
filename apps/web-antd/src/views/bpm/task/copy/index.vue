<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProcessInstanceCopyPage } from '#/api/bpm/processInstance';
import { DocAlert } from '#/components/doc-alert';
import { router } from '#/router';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'BpmCopyTask' });

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getProcessInstanceCopyPage({
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
      refresh: { code: 'query' },
      search: true,
    },
    cellConfig: {
      height: 64,
    },
  } as VxeTableGridOptions<BpmProcessInstanceApi.ProcessInstanceVO>,
});

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<BpmProcessInstanceApi.ProcessInstanceVO>) {
  switch (code) {
    case 'detail': {
      onDetail(row);
      break;
    }
  }
}

/** 任务详情 */
function onDetail(row: BpmProcessInstanceApi.CopyVO) {
  const query = {
    id: row.processInstanceId,
    ...(row.activityId && { activityId: row.activityId }),
  };
  router.push({
    name: 'BpmProcessInstanceDetail',
    query,
  });
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="审批转办、委派、抄送"
        url="https://doc.iocoder.cn/bpm/task-delegation-and-cc/"
      />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="抄送任务">
      <!-- 摘要 -->
      <template #slot-summary="{ row }">
        <div
          class="flex flex-col py-2"
          v-if="row.summary && row.summary.length > 0"
        >
          <div v-for="(item, index) in row.summary" :key="index">
            <span class="text-gray-500">
              {{ item.key }} : {{ item.value }}
            </span>
          </div>
        </div>
        <div v-else>-</div>
      </template>
      <!-- 抄送人 -->
      <template #slot-createUser="{ row }">
        <span class="text-gray-500">
          {{ row.createUser.nickname || '系统' }}
        </span>
      </template>
    </Grid>
  </Page>
</template>
