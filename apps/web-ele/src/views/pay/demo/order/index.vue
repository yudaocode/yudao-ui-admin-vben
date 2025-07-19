<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DemoOrderApi } from '#/api/pay/demo/order';

import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDemoOrderPage, refundDemoOrder } from '#/api/pay/demo/order';
import { $t } from '#/locales';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const router = useRouter();

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建订单 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 支付按钮操作 */
function handlePay(row: DemoOrderApi.Order) {
  router.push({
    name: 'PayCashier',
    query: {
      id: row.payOrderId,
      returnUrl: encodeURIComponent(`/pay/demo/order?id=${row.id}`),
    },
  });
}

/** 退款按钮操作 */
async function handleRefund(row: DemoOrderApi.Order) {
  const loadingInstance = ElLoading.service({
    text: '退款中，请稍后...',
    fullscreen: true,
  });
  try {
    await refundDemoOrder(row.id as number);
    ElMessage.success('退款成功');
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDemoOrderPage({
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<DemoOrderApi.Order>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="支付宝支付接入"
        url="https://doc.iocoder.cn/pay/alipay-pay-demo/"
      />
      <DocAlert
        title="支付宝、微信退款接入"
        url="https://doc.iocoder.cn/pay/refund-demo/"
      />
      <DocAlert
        title="微信公众号支付接入"
        url="https://doc.iocoder.cn/pay/wx-pub-pay-demo/"
      />
      <DocAlert
        title="微信小程序支付接入"
        url="https://doc.iocoder.cn/pay/wx-lite-pay-demo/"
      />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="示例订单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['示例订单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #refundTime="{ row }">
        <span v-if="row.refundTime">{{ formatDateTime(row.refundTime) }}</span>
        <span v-else-if="row.payRefundId">退款中，等待退款结果</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '前往支付',
              type: 'primary',
              link: true,
              ifShow: !row.payStatus,
              onClick: handlePay.bind(null, row),
            },
            {
              label: '发起退款',
              type: 'danger',
              link: true,
              ifShow: row.payStatus && !row.payRefundId,
              popConfirm: {
                title: '确定发起退款吗？',
                confirm: handleRefund.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
