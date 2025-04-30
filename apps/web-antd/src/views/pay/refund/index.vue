<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import * as RefundApi from '#/api/pay/refund';
import { DocAlert } from '#/components/doc-alert';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

const [RefundDetailModal, refundDetailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await RefundApi.exportRefund(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '支付退款.xls', source: data });
}

/** 查看详情 */
function onDetail(row: any) {
  refundDetailModalApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<any>) {
  switch (code) {
    case 'detail': {
      onDetail(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await RefundApi.getRefundPage({
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
  } as VxeTableGridOptions<any>,
});
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="支付宝、微信退款接入"
        url="https://doc.iocoder.cn/pay/refund-demo/"
      />
    </template>
    <RefundDetailModal @success="onRefresh" />
    <Grid table-title="支付退款列表">
      <template #toolbar-tools>
        <Button
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['pay:refund:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
