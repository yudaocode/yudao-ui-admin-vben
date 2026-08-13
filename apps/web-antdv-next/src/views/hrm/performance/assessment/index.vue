<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page } from '@vben/common-ui';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePerformanceArchiveEmployeeRecords,
  getPerformanceArchiveEmployeePage,
} from '#/api/hrm/performance/assessment';
import { $t } from '#/locales';

import { useArchiveGridColumns, useArchiveGridFormSchema } from './data';

defineOptions({ name: 'HrmPerformanceAssessment' });

const router = useRouter();
const checkedEmployeeIds = ref<number[]>([]);

function openDetail(employeeId: number) {
  router.push({
    name: 'HrmPerformanceAssessmentEmployee',
    params: { employeeId },
  });
}

async function handleDelete(employeeIds: number[]) {
  if (employeeIds.length === 0) return;
  await confirm($t('ui.actionMessage.deleteConfirm'));
  await deletePerformanceArchiveEmployeeRecords(employeeIds);
  message.success($t('ui.actionMessage.deleteSuccess'));
  gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useArchiveGridFormSchema() },
  gridOptions: {
    columns: useArchiveGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          getPerformanceArchiveEmployeePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { keyField: 'employeeId', isHover: true },
    checkboxConfig: { highlight: true },
  } as VxeTableGridOptions<HrmPerformanceAssessmentApi.PerformanceArchiveEmployee>,
  gridEvents: {
    checkboxAll: ({
      records,
    }: {
      records: HrmPerformanceAssessmentApi.PerformanceArchiveEmployee[];
    }) => {
      checkedEmployeeIds.value = records.map((r) => r.employeeId);
    },
    checkboxChange: ({
      records,
    }: {
      records: HrmPerformanceAssessmentApi.PerformanceArchiveEmployee[];
    }) => {
      checkedEmployeeIds.value = records.map((r) => r.employeeId);
    },
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【绩效】绩效考核、绩效档案"
        url="https://doc.iocoder.cn/hrm/performance/assessment/"
      />
    </template>
    <Grid table-title="绩效档案">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '批量删除',
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:performance:archive:delete'],
              disabled: !checkedEmployeeIds.length,
              onClick: () => handleDelete(checkedEmployeeIds),
            },
          ]"
        />
      </template>
      <template #employeeName="{ row }">
        <a
          class="text-primary cursor-pointer"
          @click="openDetail(row.employeeId)"
        >
          {{ row.employeeName }}
        </a>
      </template>
    </Grid>
  </Page>
</template>
