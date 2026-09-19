<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaDiscussionApi } from '#/api/oa/discussion';

import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';
import { buildSortingField } from '@vben/request';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDiscussionPage } from '#/api/oa/discussion';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'OaDiscussionList' });

const router = useRouter();

/** 打开讨论详情 */
function handleDetail(row: OaDiscussionApi.Discussion) {
  router.push({
    name: 'OaDiscussionDetail',
    params: { id: row.id },
  });
}

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
        query: async ({ page, sorts }, formValues) => {
          return await getDiscussionPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            ...buildSortingField(sorts),
          });
        },
      },
      sort: true,
    },
    sortConfig: {
      remote: true,
      multiple: false,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaDiscussionApi.Discussion>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="【协作】公告、讨论、通讯录与笔记" url="https://doc.iocoder.cn/oa/collaboration/communication/" />
    <Grid table-title="讨论列表">
      <template #title="{ row }">
        <span class="cursor-pointer text-primary" @click="handleDetail(row)">
          {{ row.title }}
        </span>
      </template>
    </Grid>
  </Page>
</template>
