<script lang="ts" setup>
import type { ReportRow } from './data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemWorkLogApi } from '#/api/pms/pm/workitem/worklog';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Alert, Button, Empty } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProjectWorkItemWorkLogReport } from '#/api/pms/pm/workitem/worklog';
import WorkItemDetail from '#/views/pms/pm/workitem/detail/work-item-detail.vue';

import { useGridColumns, useSearchFormSchema } from './data';

defineOptions({ name: 'PmsProjectWorkLog' });

const props = defineProps<{
  editable: boolean;
  projectId: number;
  projectType: number;
}>();

const report = ref<PmsWorkItemWorkLogApi.ProjectWorkLogReport>({
  dates: [],
  totalHours: 0,
  groups: [],
}); // 工时统计报表
const tableRows = computed<ReportRow[]>(() =>
  report.value.groups.map((group) => ({
    rowKey: `group-${group.iterationId || 0}`,
    workItemId: 0,
    serialNumber: 0,
    name: group.iterationName,
    type: 0,
    totalHours: group.totalHours,
    dailyHours: {},
    group: true,
    children: group.items.map((item) => ({
      ...item,
      rowKey: `item-${item.workItemId}`,
    })),
  })),
); // 工时统计表格树形行

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSearchFormSchema(handleCreateTimeChange),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useGridColumns([]),
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async (_, formValues) => {
          // 结束日归一为当天最后一刻，避免漏查结束日当天的工时
          const createTime: [string, string] = [
            formValues.createTime[0],
            dayjs(formValues.createTime[1])
              .endOf('day')
              .format('YYYY-MM-DD HH:mm:ss'),
          ];
          report.value = await getProjectWorkItemWorkLogReport({
            projectId: props.projectId,
            createTime,
            iterationName: formValues.iterationName || undefined,
          });
          // 日期列跟随报表的日期范围动态生成
          gridApi.setGridOptions({
            columns: useGridColumns(report.value.dates),
          });
          return { list: tableRows.value, total: tableRows.value.length };
        },
      },
    },
    rowConfig: {
      keyField: 'rowKey',
      isHover: true,
    },
    toolbarConfig: { enabled: false },
    treeConfig: {
      childrenField: 'children',
      expandAll: true,
    },
  } as VxeTableGridOptions<ReportRow>,
});

/** 切换日期范围时直接查询 */
async function handleCreateTimeChange() {
  await gridApi.formApi.submit();
}

const [WorkItemDetailDrawer, workItemDetailDrawerApi] = useVbenDrawer({
  connectedComponent: WorkItemDetail,
});

/** 打开工作项详情 */
function openWorkItem(row: ReportRow) {
  workItemDetailDrawerApi.setData({ id: row.workItemId }).open();
}

/** 刷新工时报表 */
function refresh() {
  gridApi.query();
}
defineExpose({ refresh });
</script>

<template>
  <div>
    <!-- 工时汇总 -->
    <Alert
      class="!mb-3"
      :message="`当前范围累计登记 ${report.totalHours} 小时`"
      show-icon
      type="info"
    />

    <!-- 列表 -->
    <Grid>
      <template #name="{ row }">
        <span v-if="row.group" class="font-semibold">{{ row.name }}</span>
        <Button v-else type="link" @click="openWorkItem(row)">
          #{{ row.serialNumber }} {{ row.name }}
        </Button>
      </template>
      <template #empty>
        <Empty description="当前范围暂无工时记录" />
      </template>
    </Grid>
  </div>
  <!-- 工作项详情 -->
  <WorkItemDetailDrawer @success="refresh" />
</template>
