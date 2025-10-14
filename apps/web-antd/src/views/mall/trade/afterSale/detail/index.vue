<script setup lang="ts">
import type { MallAfterSaleApi } from '#/api/mall/trade/afterSale';
import type { MallOrderApi } from '#/api/mall/trade/order';

import { h, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, useTabs } from '@vben/hooks';
import { $t } from '@vben/locales';

import { Card, message, Modal, Timeline } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import * as AfterSaleApi from '#/api/mall/trade/afterSale/index';
import { useDescription } from '#/components/description';
import { TableAction } from '#/components/table-action';

import {
  getUserTypeColor,
  useAfterSaleInfoSchema,
  useOperateLogSchema,
  useOrderInfoSchema,
  useProductInfoSchema,
  useRefundStatusSchema,
} from './data';

defineOptions({ name: 'TradeAfterSaleDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const loading = ref(false);
const afterSaleId = ref(0);
const afterSale = ref<MallAfterSaleApi.AfterSale>({
  order: {} as MallOrderApi.Order,
  orderItem: {} as MallOrderApi.OrderItem,
  logs: [] as any[],
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

// TODO @AI：只把 columns 拿出去
const [ProductGrid] = useVbenVxeGrid({
  gridOptions: {
    ...useProductInfoSchema(),
    class: 'mt-4',
  },
});

// TODO @AI：只把 columns 拿出去
const [OperateLogGrid] = useVbenVxeGrid({
  gridOptions: {
    ...useOperateLogSchema(),
    class: 'mt-4',
  },
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

    // 更新商品信息
    if (res.orderItem) {
      ProductGrid.api?.reload([res.orderItem]);
    }
    // 更新操作日志
    if (res.logs) {
      OperateLogGrid.api?.reload(res.logs);
    }
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

/** 渲染操作日志时间线 */
function renderTimeline() {
  return afterSale.value.logs?.map((log: any) => ({
    key: log.id,
    children: [
      h(
        'div',
        {
          style: {
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            position: 'relative',
            marginLeft: '10px',
          },
        },
        [
          h('div', log.content),
          h('div', {
            style: {
              position: 'absolute',
              left: '-16px',
              top: '10px',
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: '8px solid #f5f5f5',
            },
          }),
        ],
      ),
    ],
    dot: h(
      'span',
      {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          fontSize: '10px',
          color: '#fff',
          borderRadius: '50%',
          backgroundColor: getUserTypeColor(log.userType ?? 0),
        },
      },
      getDictLabel(DICT_TYPE.USER_TYPE, log.userType)?.[0] || '系',
    ),
  }));
}

onMounted(() => {
  afterSaleId.value = Number(route.params.id);
  getDetail();
});
</script>

<template>
  <Page auto-content-height :title="afterSale.no" :loading="loading">
    <DisagreeModal @success="getDetail" />

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
    <Card class="mb-4" title="商品信息">
      <ProductGrid />
    </Card>
    <!-- 操作日志 -->
    <Card class="mb-4" title="售后日志">
      <div style="margin-left: 160px">
        <Timeline :items="renderTimeline()" />
      </div>
    </Card>
  </Page>
</template>
