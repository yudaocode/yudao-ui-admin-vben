<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallAfterSaleApi } from '#/api/mall/trade/afterSale';
import type { MallOrderApi } from '#/api/mall/trade/order';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { $t } from '@vben/locales';

import { Card, message, Modal, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
// TODO @AI：移除 AfterSaleApi，直接换成 api
import * as AfterSaleApi from '#/api/mall/trade/afterSale/index';
import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import { TableAction } from '#/components/table-action';

import {
  useAfterSaleInfoSchema,
  useOperateLogSchema,
  useOrderInfoSchema,
  useProductColumns,
  useRefundStatusSchema,
} from './data';

defineOptions({ name: 'TradeAfterSaleDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const loading = ref(false);
const afterSaleId = ref(0);
const afterSale = ref<MallAfterSaleApi.AfterSale>({
  order: {},
  orderItem: {},
  logs: [],
});

const [OrderDescriptions] = useDescription({
  componentProps: {
    title: '订单信息',
    bordered: false,
    column: 3,
  },
  schema: useOrderInfoSchema(),
});

const [AfterSaleDescriptions] = useDescription({
  componentProps: {
    title: '售后信息',
    bordered: false,
    column: 3,
  },
  schema: useAfterSaleInfoSchema(),
});

const [RefundStatusDescriptions] = useDescription({
  componentProps: {
    title: '退款状态',
    bordered: false,
    column: 1,
  },
  schema: useRefundStatusSchema(),
});

const [ProductGrid, productGridApi] = useVbenVxeGrid({
  gridOptions: {
    cellConfig: {
      height: 60,
    },
    columns: useProductColumns(),
    data: [],
    height: 'auto',
    border: true,
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MallOrderApi.OrderItem>,
});

const [OperateLogGrid, operateLogGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useOperateLogSchema(),
    data: [],
    border: true,
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions,
});

const [DisagreeModal, disagreeModalApi] = useVbenModal({
  connectedComponent: () => import('./modules/disagree-form.vue'),
  destroyOnClose: true,
});

/** 获得详情 */
async function getDetail() {
  loading.value = true;
  try {
    const res = await AfterSaleApi.getAfterSale(afterSaleId.value);
    if (res === null) {
      message.error('售后订单不存在');
      handleBack();
      return;
    }
    afterSale.value = res;
    await productGridApi.setGridOptions({ data: [afterSale.value.orderItem] });
    await operateLogGridApi.setGridOptions({
      data: afterSale.value.logs || [],
    });
  } finally {
    loading.value = false;
  }
}

/** 同意售后 */
// TODO @AI：需要 loading
async function agree() {
  Modal.confirm({
    title: '确认操作',
    content: '是否同意售后？',
    onOk: async () => {
      await AfterSaleApi.agree(afterSale.value.id!);
      message.success($t('page.common.success'));
      await getDetail();
    },
  });
}

/** 拒绝售后 */
function disagree() {
  disagreeModalApi.setData({ afterSale: afterSale.value }).open();
}

/** 确认收货 */
// TODO @AI：需要 loading
async function receive() {
  Modal.confirm({
    title: '确认操作',
    content: '是否确认收货？',
    onOk: async () => {
      await AfterSaleApi.receive(afterSale.value.id!);
      message.success($t('page.common.success'));
      await getDetail();
    },
  });
}

/** 拒绝收货 */
// TODO @AI：需要 loading
async function refuse() {
  Modal.confirm({
    title: '确认操作',
    content: '是否拒绝收货？',
    onOk: async () => {
      await AfterSaleApi.refuse(afterSale.value.id!);
      message.success($t('page.common.success'));
      await getDetail();
    },
  });
}

/** 确认退款 */
// TODO @AI：需要 loading
async function refund() {
  Modal.confirm({
    title: '确认操作',
    content: '是否确认退款？',
    onOk: async () => {
      await AfterSaleApi.refund(afterSale.value.id!);
      message.success($t('page.common.success'));
      await getDetail();
    },
  });
}

/** 返回列表页 */
function handleBack() {
  tabs.closeCurrentTab();
  router.push('/mall/trade/afterSale');
}

/** 获取操作按钮 */
function getActionButtons() {
  const buttons: any[] = [
    {
      label: '返回',
      type: 'default',
      icon: 'lucide:arrow-left',
      onClick: handleBack,
    },
  ];

  // 根据状态添加不同的操作按钮
  switch (afterSale.value.status) {
    case 10: {
      buttons.push(
        {
          label: '同意售后',
          type: 'primary',
          onClick: agree,
        },
        {
          label: '拒绝售后',
          type: 'primary',
          onClick: disagree,
        },
      );

      break;
    }
    case 30: {
      buttons.push(
        {
          label: '确认收货',
          type: 'primary',
          onClick: receive,
        },
        {
          label: '拒绝收货',
          type: 'primary',
          onClick: refuse,
        },
      );

      break;
    }
    case 40: {
      buttons.push({
        label: '确认退款',
        type: 'primary',
        onClick: refund,
      });

      break;
    }
    // No default
  }

  return buttons;
}

onMounted(() => {
  afterSaleId.value = Number(route.params.id);
  getDetail();
});
</script>

<template>
  <Page auto-content-height :title="afterSale.no" :loading="loading">
    <!-- TODO @AI：晚点搞；
    <DisagreeModal @success="getDetail" />
    -->

    <!-- TODO @AI：直接写，不用 getActionButtons；按钮是否展示，使用 ifShow -->
    <template #extra>
      <TableAction :actions="getActionButtons()" />
    </template>

    <!-- 订单信息 -->
    <Card class="mb-4">
      <OrderDescriptions :data="afterSale" />
    </Card>
    <!-- 售后信息 -->
    <Card class="mb-4">
      <AfterSaleDescriptions :data="afterSale" />
    </Card>
    <!-- 退款状态 -->
    <Card class="mb-4">
      <RefundStatusDescriptions :data="afterSale" />
    </Card>
    <!-- 商品信息 -->
    <div class="mb-4">
      <ProductGrid table-title="商品信息">
        <template #spuName="{ row }">
          <div class="flex flex-1 flex-col items-start gap-1 gap-2 text-left">
            <span class="text-sm">{{ row.spuName }}</span>
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="property in row.properties"
                :key="property.propertyId!"
                size="small"
              >
                {{ property.propertyName }}: {{ property.valueName }}
              </Tag>
            </div>
          </div>
        </template>
      </ProductGrid>
    </div>
    <!-- 操作日志 -->
    <div>
      <OperateLogGrid table-title="售后日志">
        <template #userType="{ row }">
          <Tag v-if="row.userId === 0" color="default">系统</Tag>
          <DictTag v-else :type="DICT_TYPE.USER_TYPE" :value="row.userType" />
        </template>
      </OperateLogGrid>
    </div>
  </Page>
</template>
