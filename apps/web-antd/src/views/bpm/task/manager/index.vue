<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmTaskApi } from '#/api/bpm/task';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTaskManagerPage } from '#/api/bpm/task';
import { DocAlert } from '#/components/doc-alert';
import { router } from '#/router';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'BpmManagerTask' });

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
          return await getTaskManagerPage({
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
    case 'history': {
      onHistory(row);
      break;
    }
  }
}

/** 查看历史 */
function onHistory(row: BpmTaskApi.TaskVO) {
  console.warn(row);
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: {
      // TODO @siye：数据类型，会爆红哈；
      id: row.processInstance.id,
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
    <DocAlert title="工作流手册" url="https://doc.iocoder.cn/bpm/" />

    <FormModal @success="onRefresh" />
    <Grid table-title="流程任务">
      <!-- 摘要 -->
      <!-- TODO siye：这个要不要，也放到 data.ts 处理掉？ -->
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
