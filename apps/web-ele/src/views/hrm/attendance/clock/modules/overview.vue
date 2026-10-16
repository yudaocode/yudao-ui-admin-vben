<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { ElButton } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportAttendanceMonthDailyOverview,
  getAttendanceMonthDailyOverviewPage,
} from '#/api/hrm/attendance/statistics';
import { getHrmOverviewTextClass } from '#/views/hrm/utils/format';

import {
  buildOverviewGridColumns,
  buildOverviewQueryParams,
  useOverviewFormSchema,
} from '../data';
import DailyDetail from './daily-detail.vue';

defineOptions({ name: 'HrmAttendanceClockOverview' });

const exportLoading = ref(false);

const [DailyDetailModal, dailyDetailModalApi] = useVbenModal({
  connectedComponent: DailyDetail,
  destroyOnClose: true,
});

async function queryOverview(
  { page }: { page: { currentPage: number; pageSize: number } },
  formValues: Record<string, unknown>,
) {
  gridApi.setGridOptions({
    columns: buildOverviewGridColumns(
      String(formValues.month || formatDate(new Date(), 'YYYY-MM')),
    ),
  });
  return await getAttendanceMonthDailyOverviewPage({
    pageNo: page.currentPage,
    pageSize: page.pageSize,
    ...buildOverviewQueryParams(formValues),
  });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useOverviewFormSchema() },
  gridOptions: {
    columns: buildOverviewGridColumns(formatDate(new Date(), 'YYYY-MM')),
    height: 'auto',
    proxyConfig: { ajax: { query: queryOverview } },
    rowConfig: { keyField: 'employeeId', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<HrmAttendanceStatisticsApi.MonthDailyOverview>,
});

async function handleExport() {
  try {
    await confirm({
      content: '确认导出当前筛选条件下的打卡概况吗？',
      title: '导出确认',
    });
  } catch {
    return;
  }
  exportLoading.value = true;
  try {
    const data = await exportAttendanceMonthDailyOverview(
      buildOverviewQueryParams(await gridApi.formApi.getValues()),
    );
    downloadFileFromBlobPart({
      fileName: '员工月度打卡概况.xls',
      source: data,
    });
  } finally {
    exportLoading.value = false;
  }
}

function getDailyOverview(
  row: HrmAttendanceStatisticsApi.MonthDailyOverview,
  field: number | string,
) {
  return row.dailyClockMap?.[String(field)];
}

function openDailyDetail(
  row: HrmAttendanceStatisticsApi.MonthDailyOverview,
  field: number | string,
) {
  dailyDetailModalApi
    .setData({ attendanceDate: String(field), employeeId: row.employeeId })
    .open();
}
</script>

<template>
  <div class="h-full pt-2">
    <DailyDetailModal />
    <Grid class="h-full" table-title="打卡概况">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '导出',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['hrm:attendance:clock:export'],
              loading: exportLoading,
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #dailyOverview="{ column, row }">
        <ElButton
          v-if="getDailyOverview(row, column.field)"
          class="!h-auto min-h-[52px] w-full !justify-start whitespace-normal !px-2 !py-1.5 text-left"
          link
          type="primary"
          @click="openDailyDetail(row, column.field)"
        >
          <span class="flex w-full flex-col gap-0.5">
            <span
              v-for="(item, index) in getDailyOverview(row, column.field)
                ?.overviews || []"
              :key="`${item.text || item.type}-${index}`"
              class="grid min-h-5 w-full grid-cols-[32px_48px_1fr] items-center gap-x-1 leading-5"
            >
              <template v-if="item.type">
                <span class="text-muted-foreground">{{ item.type }}</span>
                <span>{{ item.time }}</span>
                <span :class="getHrmOverviewTextClass(item.status)">
                  {{ item.status }}
                </span>
              </template>
              <span
                v-else
                class="col-span-3 text-center"
                :class="getHrmOverviewTextClass(item.text)"
              >
                {{ item.text }}
              </span>
            </span>
          </span>
        </ElButton>
        <span v-else class="text-muted-foreground">-</span>
      </template>
    </Grid>
  </div>
</template>
