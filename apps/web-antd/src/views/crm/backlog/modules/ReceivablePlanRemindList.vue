<!-- 待回款提醒 -->
<script lang="ts" setup>
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { CrmReceivableApi } from '#/api/crm/receivable';

import { useRouter } from 'vue-router';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getReceivablePage } from '#/api/crm/receivable';

import {
  useReceivablePlanRemindColumns,
  useReceivablePlanRemindFormSchema,
} from '../data';

const { push } = useRouter();

/** 打开回款详情 */
function openDetail(row: CrmReceivableApi.Receivable) {
  push({ name: 'CrmReceivableDetail', params: { id: row.id } });
}

/** 打开客户详情 */
function openCustomerDetail(row: CrmReceivableApi.Receivable) {
  push({ name: 'CrmCustomerDetail', params: { id: row.customerId } });
}

/** 创建回款 */
function openReceivableForm(row: CrmReceivableApi.Receivable) {
  // Todo: 打开创建回款
  push({ name: 'CrmCustomerDetail', params: { id: row.customerId } });
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<CrmReceivableApi.Receivable>) {
  switch (code) {
    case 'receivableForm': {
      openReceivableForm(row);
      break;
    }
  }
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useReceivablePlanRemindFormSchema(),
  },
  gridOptions: {
    columns: useReceivablePlanRemindColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getReceivablePage({
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
  },
});
</script>

<template>
  <Grid table-title="待回款提醒">
    <template #customerName="{ row }">
      <Button type="link" @click="openCustomerDetail(row)">
        {{ row.customerName }}
      </Button>
    </template>
    <template #period="{ row }">
      <Button type="link" @click="openDetail(row)">{{ row.period }}</Button>
    </template>
  </Grid>
</template>
