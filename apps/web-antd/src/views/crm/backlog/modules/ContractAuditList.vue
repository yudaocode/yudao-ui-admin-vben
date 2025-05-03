<!-- 待审核合同 -->
<script lang="ts" setup>
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { CrmContractApi } from '#/api/crm/contract';

import { useRouter } from 'vue-router';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getContractPage } from '#/api/crm/contract';

import { useContractAuditFormSchema, useContractColumns } from '../data';

const { push } = useRouter();

/** 查看审批 */
function openProcessDetail(row: CrmContractApi.Contract) {
  push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId },
  });
}

/** 打开合同详情 */
function openContractDetail(row: CrmContractApi.Contract) {
  push({ name: 'CrmContractDetail', params: { id: row.id } });
}
/** 打开客户详情 */
function openCustomerDetail(row: CrmContractApi.Contract) {
  push({ name: 'CrmCustomerDetail', params: { id: row.id } });
}

/** 打开联系人详情 */
function openContactDetail(row: CrmContractApi.Contract) {
  push({ name: 'CrmContactDetail', params: { id: row.id } });
}

/** 打开商机详情 */
function openBusinessDetail(row: CrmContractApi.Contract) {
  push({ name: 'CrmBusinessDetail', params: { id: row.id } });
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<CrmContractApi.Contract>) {
  switch (code) {
    case 'processDetail': {
      openProcessDetail(row);
      break;
    }
  }
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useContractAuditFormSchema(),
  },
  gridOptions: {
    columns: useContractColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getContractPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            sceneType: 1, // 我负责的
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
  <Grid table-title="待审核合同">
    <template #name="{ row }">
      <Button type="link" @click="openContractDetail(row)">
        {{ row.name }}
      </Button>
    </template>
    <template #customerName="{ row }">
      <Button type="link" @click="openCustomerDetail(row)">
        {{ row.customerName }}
      </Button>
    </template>
    <template #businessName="{ row }">
      <Button type="link" @click="openBusinessDetail(row)">
        {{ row.businessName }}
      </Button>
    </template>
    <template #contactName="{ row }">
      <Button type="link" @click="openContactDetail(row)">
        {{ row.contactName }}
      </Button>
    </template>
  </Grid>
</template>
