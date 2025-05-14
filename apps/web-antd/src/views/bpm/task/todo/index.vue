<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmTaskApi } from '#/api/bpm/task';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTaskTodoPage } from '#/api/bpm/task';
import { DocAlert } from '#/components/doc-alert';
import { router } from '#/router';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'BpmTodoTask' });

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
          return await getTaskTodoPage({
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
  } as VxeTableGridOptions<BpmTaskApi.TaskVO>,
});

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<BpmTaskApi.TaskVO>) {
  switch (code) {
    case 'audit': {
      onAudit(row);
      break;
    }
  }
}

/** 办理任务 */
function onAudit(row: BpmTaskApi.TaskVO) {
  console.warn(row);
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: row.processInstance.id,
      taskId: row.id,
    },
  });
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <DocAlert
      title="审批通过、不通过、驳回"
      url="https://doc.iocoder.cn/bpm/task-todo-done/"
    />
    <DocAlert title="审批加签、减签" url="https://doc.iocoder.cn/bpm/sign/" />
    <DocAlert
      title="审批转办、委派、抄送"
      url="https://doc.iocoder.cn/bpm/task-delegation-and-cc/"
    />
    <DocAlert title="审批加签、减签" url="https://doc.iocoder.cn/bpm/sign/" />

    <FormModal @success="onRefresh" />
    <Grid table-title="待办任务">
      <!-- 摘要 -->
      <template #slot-summary="{ row }">
        <div
          class="flex flex-col py-2"
          v-if="
            row.processInstance.summary &&
            row.processInstance.summary.length > 0
          "
        >
          <div
            v-for="(item, index) in row.processInstance.summary"
            :key="index"
          >
            <span class="text-gray-500">
              {{ item.key }} : {{ item.value }}
            </span>
          </div>
        </div>
        <div v-else>-</div>
      </template>
    </Grid>
  </Page>
</template>
