<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallCombinationRecordApi } from '#/api/mall/promotion/combination/combinationRecord';

import { onMounted, ref } from 'vue';

import { DocAlert, Page, SummaryCard, useVbenModal } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCombinationRecordPage,
  getCombinationRecordSummary,
} from '#/api/mall/promotion/combination/combinationRecord';

import { useGridColumns, useGridFormSchema } from './data';
import CombinationUserList from './modules/list.vue';

defineOptions({ name: 'PromotionCombinationRecord' });

const summary = ref<MallCombinationRecordApi.RecordSummary>();
onMounted(async () => {
  summary.value = await getCombinationRecordSummary();
});

const [UserListModal, userListModalApi] = useVbenModal({
  connectedComponent: CombinationUserList,
  destroyOnClose: true,
});

/** 查看拼团用户 */
function handleViewUsers(row: any) {
  userListModalApi.setData({ headId: row.headId || row.id }).open();
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
        query: async ({ page }, formValues) => {
          return await getCombinationRecordPage({
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
  } as VxeTableGridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【营销】拼团活动"
        url="https://doc.iocoder.cn/mall/promotion-combination/"
      />
    </template>

    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <SummaryCard title="参与人数" :value="summary?.userCount ?? 0" />
      <SummaryCard title="成团数量" :value="summary?.successCount ?? 0" />
      <SummaryCard
        title="虚拟成团数量"
        :value="summary?.virtualGroupCount ?? 0"
      />
    </div>

    <UserListModal />

    <Grid table-title="拼团记录列表">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '查看成员',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['promotion:combination-record:query'],
              onClick: handleViewUsers.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
