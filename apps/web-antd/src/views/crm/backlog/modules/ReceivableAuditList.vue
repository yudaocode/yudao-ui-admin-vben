<!-- 待审核回款 -->
<script lang="ts" setup>
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { CrmReceivableApi } from '#/api/crm/receivable';

import { useRouter } from 'vue-router';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getReceivablePage } from '#/api/crm/receivable';

import {
  useReceivableAuditColumns,
  useReceivableAuditFormSchema,
} from '../data';

const { push } = useRouter();

/** 查看审批 */
function openProcessDetail(row: CrmReceivableApi.Receivable) {
  push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId },
  });
}

/** 打开回款详情 */
function openDetail(row: CrmReceivableApi.Receivable) {
  push({ name: 'CrmReceivableDetail', params: { id: row.id } });
}

/** 打开客户详情 */
function openCustomerDetail(row: CrmReceivableApi.Receivable) {
  push({ name: 'CrmCustomerDetail', params: { id: row.customerId } });
}

/** 打开合同详情 */
function openContractDetail(row: CrmReceivableApi.Receivable) {
  push({ name: 'CrmContractDetail', params: { id: row.contractId } });
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<CrmReceivableApi.Receivable>) {
  switch (code) {
    case 'processDetail': {
      openProcessDetail(row);
      break;
    }
  }
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useReceivableAuditFormSchema(),
  },
  gridOptions: {
    columns: useReceivableAuditColumns(onActionClick),
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
  <Grid table-title="待审核回款">
    <template #no="{ row }">
      <Button type="link" @click="openDetail(row)">
        {{ row.no }}
      </Button>
    </template>
    <template #customerName="{ row }">
      <Button type="link" @click="openCustomerDetail(row)">
        {{ row.customerName }}
      </Button>
    </template>
    <template #contractNo="{ row }">
      <Button type="link" @click="openContractDetail(row)">
        {{ row.contractNo }}
      </Button>
    </template>
  </Grid>
</template>
