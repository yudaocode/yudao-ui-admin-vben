<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallAfterSaleApi } from '#/api/mall/trade/afterSale';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';

import { ElButton, ElTabs } from 'element-plus';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAfterSalePage } from '#/api/mall/trade/afterSale';
import { DICT_TYPE, getDictOptions } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';

const { push } = useRouter();

const status = ref('0');
const statusTabs = ref([
  {
    label: '全部',
    value: '0',
  },
]);

/** 处理退款 */
function openAfterSaleDetail(row: MallAfterSaleApi.AfterSale) {
  push({ name: 'TradeAfterSaleDetail', params: { id: row.id } });
}

// TODO @xingyu：缺详情页
/** 查看订单详情 */
function openOrderDetail(row: MallAfterSaleApi.AfterSale) {
  push({ name: 'TradeOrderDetail', params: { id: row.id } });
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
          return await getAfterSalePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            status: status.value === '0' ? undefined : status.value,
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
  } as VxeTableGridOptions<MallAfterSaleApi.AfterSale>,
});

function onChangeStatus(key: number | string) {
  status.value = key.toString();
  gridApi.query();
}
onMounted(() => {
  for (const dict of getDictOptions(DICT_TYPE.TRADE_AFTER_SALE_STATUS)) {
    statusTabs.value.push({
      label: dict.label,
      value: dict.value.toString(),
    });
  }
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【交易】交易订单"
        url="https://doc.iocoder.cn/mall/trade-order/"
      />
    </template>
    <Grid table-title="退款列表">
      <template #top>
        <ElTabs class="border-none" @change="onChangeStatus">
          <ElTabs.TabPane
            v-for="tab in statusTabs"
            :key="tab.value"
            :tab="tab.label"
          />
        </ElTabs>
      </template>
      <template #orderNo="{ row }">
        <ElButton type="primary" link @click="openOrderDetail(row)">
          {{ row.orderNo }}
        </ElButton>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '处理退款',
              type: 'primary',
              link: true,
              onClick: openAfterSaleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
