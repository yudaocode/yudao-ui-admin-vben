<!-- 分配给我的线索 -->
<script lang="ts" setup>
import type { CrmClueApi } from '#/api/crm/clue';

import { useRouter } from 'vue-router';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCluePage } from '#/api/crm/clue';

import { useClueFollowColumns, useClueFollowFormSchema } from '../data';

const { push } = useRouter();

/** 打开线索详情 */
function onDetail(row: CrmClueApi.Clue) {
  push({ name: 'CrmClueDetail', params: { id: row.id } });
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useClueFollowFormSchema(),
  },
  gridOptions: {
    columns: useClueFollowColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getCluePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            transformStatus: false,
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
  <Grid table-title="分配给我的线索">
    <template #name="{ row }">
      <Button type="link" @click="onDetail(row)">{{ row.name }}</Button>
    </template>
  </Grid>
</template>
