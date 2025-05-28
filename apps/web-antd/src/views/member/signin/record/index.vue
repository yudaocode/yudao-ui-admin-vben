<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MemberSignInRecordApi } from '#/api/member/signin/record';

import { Page } from '@vben/common-ui';

import { Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSignInRecordPage } from '#/api/member/signin/record';

import { useGridColumns, useGridFormSchema } from './data';

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSignInRecordPage({
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
  } as VxeTableGridOptions<MemberSignInRecordApi.SignInRecord>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="签到记录列表">
      <template #point="{ row }">
        <Tag :color="row.point > 0 ? '#108ee9' : '#f50'">
          {{ row.point > 0 ? `+${row.point}` : row.point }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
