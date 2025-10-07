<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WalletTransactionApi } from '#/api/pay/wallet/transaction';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTransactionPage } from '#/api/pay/wallet/transaction';

const props = defineProps<{
  walletId: number | undefined;
}>();

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'id',
        title: '编号',
      },
      {
        field: 'title',
        title: '关联业务标题',
      },
      {
        field: 'price',
        title: '交易金额',
        formatter: 'formatAmount2',
      },
      {
        field: 'balance',
        title: '钱包余额',
        formatter: 'formatAmount2',
      },
      {
        field: 'createTime',
        title: '交易时间',
        formatter: 'formatDateTime',
      },
    ],
    keepSource: true,
    pagerConfig: {
      pageSize: 10,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getTransactionPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            walletId: props.walletId,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<WalletTransactionApi.Transaction>,
});
</script>

<template>
  <Grid />
</template>
