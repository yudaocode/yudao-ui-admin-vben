<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalarySlipSendRecordApi } from '#/api/hrm/salary/slip/send-record';

import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page } from '@vben/common-ui';

import { Button, message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSalarySlipSendRecord,
  getSalarySlipSendRecordPage,
} from '#/api/hrm/salary/slip/send-record';
import { $t } from '#/locales';

import {
  buildSendRecordQueryParams,
  formatHrmYearMonth,
  useGridColumns,
  useGridFormSchema,
} from './data';

defineOptions({ name: 'HrmSalarySlipSendRecord' });

const router = useRouter();

function openDetail(id?: number) {
  if (!id) {
    return;
  }
  router.push({
    name: 'HrmSalarySlipSendRecordDetail',
    params: { id },
  });
}

async function handleDeleteRecord(id?: number) {
  if (!id) {
    return;
  }
  try {
    await confirm('删除后，本次发放的工资条将同时删除，是否继续？', '删除确认');
    await deleteSalarySlipSendRecord(id);
    message.success($t('ui.actionMessage.deleteSuccess'));
    await gridApi.query();
  } catch {}
}

const [Grid, gridApi] = useVbenVxeGrid({
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
          return await getSalarySlipSendRecordPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...buildSendRecordQueryParams(formValues),
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
  } as VxeTableGridOptions<HrmSalarySlipSendRecordApi.SalarySlipSendRecord>,
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
    <Grid table-title="工资条发放记录">
      <template #month="{ row }">
        <Button type="link" @click="openDetail(row.id)">
          {{ formatHrmYearMonth(row.year, row.month) }}
        </Button>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: () => openDetail(row.id),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:salary:slip:delete'],
              onClick: () => handleDeleteRecord(row.id),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
