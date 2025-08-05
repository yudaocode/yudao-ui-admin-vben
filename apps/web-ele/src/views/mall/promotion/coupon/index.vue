<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallCouponApi } from '#/api/mall/promotion/coupon/coupon';

import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCoupon,
  getCouponPage,
} from '#/api/mall/promotion/coupon/coupon';
import { $t } from '#/locales';

import { getStatusTabs, useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'PromotionCoupon' });

const activeTab = ref('all');
const statusTabs = ref(getStatusTabs());

/** 删除优惠券 */
async function handleDelete(row: MallCouponApi.Coupon) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteCoupon(row.id as number);
    ElMessage.success('回收成功');
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** Tab切换 */
function onTabChange(tabName: string) {
  activeTab.value = tabName;
  // 设置状态查询参数
  const formValues = gridApi.formApi.getValues();
  const status = tabName === 'all' ? undefined : Number(tabName);
  gridApi.formApi.setValues({ ...formValues, status });
  gridApi.query();
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
          const params = {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            // Tab状态过滤
            status:
              activeTab.value === 'all' ? undefined : Number(activeTab.value),
          };
          return await getCouponPage(params);
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
  } as VxeTableGridOptions<MallCouponApi.Coupon>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【营销】优惠劵"
        url="https://doc.iocoder.cn/mall/promotion-coupon/"
      />
    </template>

    <Grid table-title="优惠券列表">
      <template #top>
        <Tabs v-model:active-key="activeTab" type="card" @change="onTabChange">
          <TabPane
            v-for="tab in statusTabs"
            :key="tab.value"
            :tab="tab.label"
          />
        </Tabs>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '回收',
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['promotion:coupon:delete'],
              popConfirm: {
                title:
                  '回收将会收回会员领取的待使用的优惠券，已使用的将无法回收，确定要回收所选优惠券吗？',
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
