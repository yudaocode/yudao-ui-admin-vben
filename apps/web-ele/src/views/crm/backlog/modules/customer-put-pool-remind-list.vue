<!-- 待进入公海的客户 -->
<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmCustomerApi } from '#/api/crm/customer';

import { useRouter } from 'vue-router';

import { ElButton } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPutPoolRemindCustomerPage } from '#/api/crm/customer';
import { useGridColumns } from '#/views/crm/customer/data';

import { SCENE_TYPES } from '../data';

const { push } = useRouter();

/** 打开客户详情 */
function handleDetail(row: CrmCustomerApi.Customer) {
  push({ name: 'CrmCustomerDetail', params: { id: row.id } });
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        fieldName: 'sceneType',
        label: '归属',
        component: 'Select',
        componentProps: {
          clearable: true,
          options: SCENE_TYPES,
        },
        defaultValue: SCENE_TYPES[0]!.value,
      },
    ],
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getPutPoolRemindCustomerPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<CrmCustomerApi.Customer>,
});
</script>

<template>
  <Grid>
    <template #name="{ row }">
      <ElButton type="primary" link @click="handleDetail(row)">
        {{ row.name }}
      </ElButton>
    </template>
    <template #actions="{ row }">
      <ElButton type="primary" link @click="handleDetail(row)">
        查看详情
      </ElButton>
    </template>
  </Grid>
</template>
