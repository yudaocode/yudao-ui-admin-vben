<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button } from 'antdv-next';

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
    const data = await exportAttendanceMonthRecord(
      buildMonthQueryParams(formValues),
    );
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
          });
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
    <template #doc>
      <DocAlert
        title="【考勤】考勤管理"
        url="https://doc.iocoder.cn/hrm/attendance/"
      />
    </template>
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
        <Button
          v-access:code="['hrm:attendance:statistics:query']"
          type="link"
          @click="openDetail(row)"
        >
          {{ row.employeeName }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
