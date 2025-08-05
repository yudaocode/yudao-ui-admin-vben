<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWallet } from '#/api/pay/wallet/balance';
import { getTransactionPage } from '#/api/pay/wallet/transaction';

import { useGridColumns } from './data';

const props = defineProps({
  walletId: {
    type: Number,
    required: false,
    default: undefined,
  },
  userId: {
    type: Number,
    required: false,
    default: undefined,
  },
});

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          let walletId = props.walletId;
          if (props.userId) {
            const wallet = await getWallet({ userId: props.userId });
            walletId = wallet.id;
          }
          return await getTransactionPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            walletId,
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
    },
  } as VxeTableGridOptions<any>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="钱包交易记录" />
  </Page>
</template>
