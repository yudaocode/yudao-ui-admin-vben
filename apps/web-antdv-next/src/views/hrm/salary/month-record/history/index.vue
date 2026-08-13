<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';

import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';

import { Button } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSalaryMonthRecordPage } from '#/api/hrm/salary/month-record';
import { HrmSalaryMonthStatus } from '#/views/hrm/utils/constants';

import {
  buildHistoryQueryParams,
  useGridColumns,
  useGridFormSchema,
} from './data';

defineOptions({ name: 'HrmSalaryHistory' });

const router = useRouter();

function openDetail(row: HrmSalaryMonthRecordApi.SalaryMonthRecord) {
  if (!row.id) {
    return;
  }
  router.push({
    name: 'HrmSalaryHistoryDetail',
    params: { id: row.id },
  });
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSalaryMonthRecordPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            status: HrmSalaryMonthStatus.HISTORY,
            ...buildHistoryQueryParams(formValues),
          });
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<HrmSalaryMonthRecordApi.SalaryMonthRecord>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【薪资】月度工资、工资条"
        url="https://doc.iocoder.cn/hrm/salary/payroll/"
      />
    </template>
    <Grid table-title="历史工资表">
      <template #title="{ row }">
        <Button type="link" @click="openDetail(row)">
          {{ row.title || '-' }}
        </Button>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: () => openDetail(row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
