<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaSupplyIssueApi } from '#/api/oa/supply/issue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSupplyApplyItemPage } from '#/api/oa/supply/issue';

import { useGridColumns, useGridFormSchema } from './data';
import IssueForm from './modules/issue-form.vue';
import ReturnForm from './modules/return-form.vue';

defineOptions({ name: 'OaSupplyIssue' });

const [IssueFormModal, issueFormModalApi] = useVbenModal({
  connectedComponent: IssueForm,
  destroyOnClose: true,
});

const [ReturnFormModal, returnFormModalApi] = useVbenModal({
  connectedComponent: ReturnForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 发放操作 */
function handleIssue(row: OaSupplyIssueApi.SupplyApplyItem) {
  issueFormModalApi.setData(row).open();
}

/** 归还操作 */
function handleReturn(row: OaSupplyIssueApi.SupplyApplyItem) {
  returnFormModalApi.setData(row).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
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
          return await getSupplyApplyItemPage({
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
  } as VxeTableGridOptions<OaSupplyIssueApi.SupplyApplyItem>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="【行政】办公用品、用印管理" url="https://doc.iocoder.cn/oa/administration/supply-seal/" />
    <IssueFormModal @success="handleRefresh" />
    <ReturnFormModal @success="handleRefresh" />

    <Grid table-title="领用发放列表">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '发放',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:supply-issue:issue'],
              ifShow: row.status === 0,
              onClick: handleIssue.bind(null, row),
            },
            {
              label: '归还',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['oa:supply-issue:return'],
              ifShow: row.status === 2,
              onClick: handleReturn.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
