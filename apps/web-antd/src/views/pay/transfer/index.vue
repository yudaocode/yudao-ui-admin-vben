<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PayTransferApi } from '#/api/pay/transfer';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTransferPage } from '#/api/pay/transfer';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看转账详情 */
function handleDetail(row: PayTransferApi.Transfer) {
  detailModalApi.setData(row).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    cellConfig: {
      height: 80,
    },
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getTransferPage({
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
  } as VxeTableGridOptions<PayTransferApi.Transfer>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="转账管理" url="https://doc.iocoder.cn/pay/transfer/" />
    </template>

    <DetailModal @success="handleRefresh" />
    <Grid table-title="转账单列表">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['pay:transfer:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
      <template #no="{ row }">
        <div class="flex flex-col gap-1 text-left">
          <p class="text-sm">
            <Tag size="small" color="blue"> 商户</Tag>
            {{ row.merchantTransferId }}
          </p>
          <p class="text-sm" v-if="row.no">
            <Tag size="small" color="orange">转账</Tag> {{ row.no }}
          </p>
          <p class="text-sm" v-if="row.channelTransferNo">
            <Tag size="small" color="green">渠道</Tag>
            {{ row.channelTransferNo }}
          </p>
        </div>
      </template>
    </Grid>
  </Page>
</template>
