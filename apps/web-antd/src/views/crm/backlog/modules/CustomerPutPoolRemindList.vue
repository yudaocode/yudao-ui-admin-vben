<!-- 待进入公海的客户 -->
<script lang="ts" setup>
import type { CrmCustomerApi } from '#/api/crm/customer';

import { useRouter } from 'vue-router';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCustomerPage } from '#/api/crm/customer';

import { useCustomerColumns, useCustomerPutPoolFormSchema } from '../data';

const { push } = useRouter();

/** 打开客户详情 */
function onDetail(row: CrmCustomerApi.Customer) {
  push({ name: 'CrmCustomerDetail', params: { id: row.id } });
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useCustomerPutPoolFormSchema(),
  },
  gridOptions: {
    columns: useCustomerColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getCustomerPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            pool: true, // 固定 公海参数为 true
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
  <Grid table-title="待进入公海的客户">
    <template #name="{ row }">
      <Button type="link" @click="onDetail(row)">{{ row.name }}</Button>
    </template>
  </Grid>
</template>
