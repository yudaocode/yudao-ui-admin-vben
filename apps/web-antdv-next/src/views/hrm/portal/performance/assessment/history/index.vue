<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';

import { Tag } from 'antdv-next';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPerformanceAssessmentPage } from '#/api/hrm/portal/performance/assessment';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';

import { useHistoryGridColumns, useHistoryGridFormSchema } from '../data';
import PerformanceAssessmentDetail from '../modules/detail-drawer.vue';

defineOptions({ name: 'HrmPortalPerformanceHistory' });

const router = useRouter();
const accessible = ref(false);

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: PerformanceAssessmentDetail,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useHistoryGridFormSchema(),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useHistoryGridColumns(),
    height: 'auto',
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async ({ page }, formValues) =>
          getPerformanceAssessmentPage({
            ...formValues,
            archived: true,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          }),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<HrmPortalPerformanceAssessmentApi.AssessmentSummary>,
});

function openDetail(row: HrmPortalPerformanceAssessmentApi.AssessmentSummary) {
  detailDrawerApi.setData({ row }).open();
}

onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  if (accessible.value) await gridApi.query();
});
</script>

<template>
  <Page v-if="accessible" auto-content-height>
    <Grid table-title="绩效档案">
      <template #resultLevel="{ row }">
        <Tag v-if="row.resultLevel" color="success">
          {{ row.resultLevel }}
        </Tag>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '查看',
              type: 'link',
              onClick: () => openDetail(row),
            },
          ]"
        />
      </template>
    </Grid>
    <DetailDrawer />
  </Page>
</template>
