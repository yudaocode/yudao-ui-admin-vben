<script lang="ts" setup>
import type { PageParam } from '@vben/request';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceLeaveApi } from '#/api/hrm/attendance/leave';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page } from '@vben/common-ui';
import { buildSortingField } from '@vben/request';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportAttendanceLeave,
  getAttendanceLeavePage,
} from '#/api/hrm/attendance/leave';

import {
  buildLeaveQueryParams,
  useGridColumns,
  useGridFormSchema,
} from './data';

defineOptions({ name: 'HrmAttendanceLeave' });

const router = useRouter();
const exportLoading = ref(false);

function handleRefresh() {
  gridApi.query();
}

function handleProcessDetail(processInstanceId?: string) {
  if (!processInstanceId) {
    return;
  }
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: processInstanceId },
  });
}

async function handleExport() {
  exportLoading.value = true;
  try {
    await confirm({
      content: '确认导出当前筛选条件下的请假记录吗？',
      title: '导出确认',
    });
    const formValues = await gridApi.formApi.getValues();
    const data = await exportAttendanceLeave({
      pageNo: 1,
      pageSize: 100,
      ...buildLeaveQueryParams(formValues),
    } as PageParam);
    downloadFileFromBlobPart({ fileName: '请假记录.xls', source: data });
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
        query: async ({ page, sorts }, formValues) => {
          return await getAttendanceLeavePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...buildLeaveQueryParams(formValues),
            ...buildSortingField(sorts),
          });
        },
      },
      sort: true,
    },
    sortConfig: {
      remote: true,
      multiple: false,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<HrmAttendanceLeaveApi.AttendanceLeave>,
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
    <Grid table-title="请假记录">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '导出',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['hrm:attendance:leave:export'],
              loading: exportLoading,
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '审批进度',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              ifShow: !!row.processInstanceId,
              onClick: handleProcessDetail.bind(null, row.processInstanceId),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
