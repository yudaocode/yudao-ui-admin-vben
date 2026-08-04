<script lang="ts" setup>
import type { PageParam } from '@vben/request';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, Page } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportAttendanceMonthRecord,
  getAttendanceMonthRecordPage,
} from '#/api/hrm/attendance/statistics';

import {
  buildMonthQueryParams,
  useGridColumns,
  useGridFormSchema,
} from './data';

defineOptions({ name: 'HrmAttendanceMonth' });

const router = useRouter();
const exportLoading = ref(false);

function handleRefresh() {
  gridApi.query();
}

function openDetail(row: HrmAttendanceStatisticsApi.MonthRecord) {
  router.push({
    name: 'HrmAttendanceMonthDetail',
    params: {
      employeeId: row.employeeId,
    },
    query: {
      year: row.year,
      month: row.month,
    },
  });
}

async function handleExport() {
  exportLoading.value = true;
  try {
    await confirm({
      content: '确认导出当前筛选条件下的月度考勤汇总吗？',
      title: '导出确认',
    });
    const formValues = await gridApi.formApi.getValues();
    const data = await exportAttendanceMonthRecord({
      pageNo: 1,
      pageSize: 100,
      ...buildMonthQueryParams(formValues),
    } as PageParam & { month: number; year: number });
    downloadFileFromBlobPart({
      fileName: '员工月度考勤汇总.xls',
      source: data,
    });
  } catch {
  } finally {
    exportLoading.value = false;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    handleValuesChange(_values, fieldsChanged) {
      if (fieldsChanged.includes('month')) {
        handleRefresh();
      }
    },
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAttendanceMonthRecordPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...buildMonthQueryParams(formValues),
          } as PageParam & { month: number; year: number });
        },
      },
    },
    rowConfig: {
      keyField: 'employeeId',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<HrmAttendanceStatisticsApi.MonthRecord>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="月度考勤汇总">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '导出',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['hrm:attendance:statistics:export'],
              loading: exportLoading,
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #employeeName="{ row }">
        <ElButton
          v-access:code="['hrm:attendance:statistics:query']"
          link
          type="primary"
          @click="openDetail(row)"
        >
          {{ row.employeeName }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
