<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallOrderApi } from '#/api/mall/trade/order';

import { h } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page, prompt, useVbenModal } from '@vben/common-ui';
import { fenToYuan } from '@vben/utils';

import { ElImage, ElInput, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getOrderPage, updateOrderRemark } from '#/api/mall/trade/order';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { DeliveryTypeEnum, DICT_TYPE, TradeOrderStatusEnum } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';
import DeleveryForm from './modules/delevery-form.vue';

const [DeleveryFormModal, deleveryFormModalApi] = useVbenModal({
  connectedComponent: DeleveryForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}
const { push } = useRouter();
// TODO xingyu：貌似详情，还点不进去哇？
/** 详情 */
function handleDetail(row: MallOrderApi.Order) {
  push({ name: 'TradeOrderDetail', params: { id: row.id } });
}

/** 发货 */
function handleDelivery(row: MallOrderApi.Order) {
  deleveryFormModalApi.setData(row).open();
}

/** 备注 */
function handleRemake(row: MallOrderApi.Order) {
  prompt({
    component: () => {
      return h(ElInput, {
        defaultValue: row.remark,
        rows: 3,
        type: 'textarea',
      });
    },
    content: '请输入订单备注',
    title: '订单备注',
    modelPropName: 'value',
  }).then(async (val) => {
    if (val) {
      await updateOrderRemark({
        id: row.id as number,
        remark: val,
      });
      onRefresh();
    }
  });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    expandConfig: {
      trigger: 'row',
      expandAll: true,
      padding: true,
    },
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getOrderPage({
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
  } as VxeTableGridOptions<MallOrderApi.Order>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【交易】交易订单"
        url="https://doc.iocoder.cn/mall/trade-order/"
      />
      <DocAlert
        title="【交易】购物车"
        url="https://doc.iocoder.cn/mall/trade-cart/"
      />
    </template>
    <DeleveryFormModal @success="onRefresh" />
    <Grid table-title="订单列表">
      <template #expand_content="{ row }">
        <div class="order-items">
          <div v-for="item in row.items" :key="item.id" class="order-item">
            <div class="order-item-image">
              <ElImage :src="item.picUrl" class="h-40 w-40" />
            </div>
            <div class="order-item-content">
              <div class="order-item-name">
                {{ item.spuName }}
                <ElTag
                  v-for="property in item.properties"
                  :key="property.id"
                  class="ml-1"
                >
                  {{ property.propertyName }}: {{ property.valueName }}
                </ElTag>
              </div>
              <div class="order-item-info">
                <span>
                  原价：{{ fenToYuan(item.price) }} 元 / 数量：{{
                    item.count
                  }}个
                </span>
                <DictTag
                  :type="DICT_TYPE.TRADE_ORDER_ITEM_AFTER_SALE_STATUS"
                  :value="item.afterSaleStatus"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['trade:order:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
          :drop-down-actions="[
            {
              label: '发货',
              link: true,
              ifShow: () =>
                row.deliveryType === DeliveryTypeEnum.EXPRESS.type &&
                row.status === TradeOrderStatusEnum.UNDELIVERED.status,
              onClick: handleDelivery.bind(null, row),
            },
            {
              label: '备注',
              link: true,
              onClick: handleRemake.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

<style lang="scss" scoped>
.order-items {
  padding: 8px 0;
}

.order-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.order-item-image {
  flex-shrink: 0;
  margin-right: 12px;
}

.order-item-content {
  flex: 1;
}

.order-item-name {
  margin-bottom: 4px;
  font-weight: 500;
}

.order-item-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}
</style>
