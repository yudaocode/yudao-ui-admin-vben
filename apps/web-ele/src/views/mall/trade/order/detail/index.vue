<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallDeliveryExpressApi } from '#/api/mall/trade/delivery/express';
import type { MallDeliveryPickUpStoreApi } from '#/api/mall/trade/delivery/pickUpStore';
import type { MallOrderApi } from '#/api/mall/trade/order';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import {
  DeliveryTypeEnum,
  DICT_TYPE,
  TradeOrderStatusEnum,
} from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { fenToYuan, formatDateTime } from '@vben/utils';

import { ElCard, ElMessage, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import * as DeliveryExpressApi from '#/api/mall/trade/delivery/express';
import * as DeliveryPickUpStoreApi from '#/api/mall/trade/delivery/pickUpStore';
import * as TradeOrderApi from '#/api/mall/trade/order';
import { DictTag } from '#/components/dict-tag';
import { TableAction } from '#/components/table-action';

import AddressForm from '../modules/address-form.vue';
import DeliveryForm from '../modules/delivery-form.vue';
import PriceForm from '../modules/price-form.vue';
import RemarkForm from '../modules/remark-form.vue';
import {
  useExpressTrackColumns,
  useOperateLogColumns,
  useProductColumns,
} from './data';

defineOptions({ name: 'TradeOrderDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const loading = ref(false);
const orderId = ref(0);
const order = ref<MallOrderApi.Order>({
  logs: [],
});
const deliveryExpressList = ref<MallDeliveryExpressApi.SimpleDeliveryExpress[]>(
  [],
);
const expressTrackList = ref<any[]>([]);
const pickUpStore = ref<MallDeliveryPickUpStoreApi.PickUpStore | undefined>();

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

const [ExpressTrackGrid, expressTrackGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useExpressTrackColumns(),
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

const [OperateLogGrid, operateLogGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useOperateLogColumns(),
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

const [DeliveryFormModal, deliveryFormModalApi] = useVbenModal({
  connectedComponent: DeliveryForm,
  destroyOnClose: true,
});

const [RemarkFormModal, remarkFormModalApi] = useVbenModal({
  connectedComponent: RemarkForm,
  destroyOnClose: true,
});

const [AddressFormModal, addressFormModalApi] = useVbenModal({
  connectedComponent: AddressForm,
  destroyOnClose: true,
});

const [PriceFormModal, priceFormModalApi] = useVbenModal({
  connectedComponent: PriceForm,
  destroyOnClose: true,
});

/** 获得详情 */
async function getDetail() {
  loading.value = true;
  try {
    const res = await TradeOrderApi.getOrder(orderId.value);
    if (res === null) {
      ElMessage.error('交易订单不存在');
      handleBack();
      return;
    }
    order.value = res;
    productGridApi.setGridOptions({ data: res.items || [] });
    operateLogGridApi.setGridOptions({ data: res.logs || [] });

    // 如果配送方式为快递，则查询物流公司
    if (res.deliveryType === DeliveryTypeEnum.EXPRESS.type) {
      deliveryExpressList.value =
        await DeliveryExpressApi.getSimpleDeliveryExpressList();
      if (res.logisticsId) {
        expressTrackList.value = await TradeOrderApi.getExpressTrackList(
          res.id!,
        );
        expressTrackGridApi.setGridOptions({
          data: expressTrackList.value || [],
        });
      }
    } else if (
      res.deliveryType === DeliveryTypeEnum.PICK_UP.type &&
      res.pickUpStoreId
    ) {
      pickUpStore.value = await DeliveryPickUpStoreApi.getDeliveryPickUpStore(
        res.pickUpStoreId,
      );
    }
  } finally {
    loading.value = false;
  }
}

/** 各种操作 */
const handleRemark = () => {
  remarkFormModalApi.setData(order.value).open();
};

const handleDelivery = () => {
  deliveryFormModalApi.setData(order.value).open();
};

const handleUpdateAddress = () => {
  addressFormModalApi.setData(order.value).open();
};

const handleUpdatePrice = () => {
  priceFormModalApi.setData(order.value).open();
};

/** 核销 */
const handlePickUp = async () => {
  await confirm('确认核销订单吗？');
  const loadingInstance = ElMessage({
    message: '正在处理中...',
    duration: 0,
    type: 'info',
  });
  try {
    await TradeOrderApi.pickUpOrder(order.value.id!);
    ElMessage.success('核销成功');
    await getDetail();
  } finally {
    loadingInstance.close();
  }
};

/** 返回列表页 */
function handleBack() {
  tabs.closeCurrentTab();
  router.push('/mall/trade/order');
}

/** 初始化 */
onMounted(async () => {
  orderId.value = Number(route.params.id);
  await getDetail();
});
</script>

<template>
  <Page auto-content-height :title="order.no" :loading="loading">
    <template #extra>
      <TableAction
        :actions="[
          {
            label: '返回',
            type: 'default',
            icon: 'lucide:arrow-left',
            onClick: handleBack,
          },
          {
            label: '调整价格',
            type: 'primary',
            onClick: handleUpdatePrice,
            ifShow: order.status === TradeOrderStatusEnum.UNPAID.status,
          },
          {
            label: '备注',
            type: 'primary',
            onClick: handleRemark,
          },
          {
            label: '发货',
            type: 'primary',
            onClick: handleDelivery,
            ifShow:
              order.status === TradeOrderStatusEnum.UNDELIVERED.status &&
              order.deliveryType === DeliveryTypeEnum.EXPRESS.type,
          },
          {
            label: '修改地址',
            type: 'primary',
            onClick: handleUpdateAddress,
            ifShow:
              order.status === TradeOrderStatusEnum.UNDELIVERED.status &&
              order.deliveryType === DeliveryTypeEnum.EXPRESS.type,
          },
          {
            label: '核销',
            type: 'primary',
            onClick: handlePickUp,
            ifShow:
              order.status === TradeOrderStatusEnum.UNDELIVERED.status &&
              order.deliveryType === DeliveryTypeEnum.PICK_UP.type,
          },
        ]"
      />
    </template>

    <!-- 各种操作的弹窗 -->
    <DeliveryFormModal @success="getDetail" />
    <RemarkFormModal @success="getDetail" />
    <AddressFormModal @success="getDetail" />
    <PriceFormModal @success="getDetail" />

    <!-- 订单信息 -->
    <ElCard class="mb-4">
      <template #header>
        <span class="font-bold">订单信息</span>
      </template>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">订单号:</span>
          <span>{{ order.no }}</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">买家:</span>
          <span>{{ order.user?.nickname }}</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">订单类型:</span>
          <DictTag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="order.type" />
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">订单来源:</span>
          <DictTag :type="DICT_TYPE.TERMINAL" :value="order.terminal" />
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">买家留言:</span>
          <span>{{ order.userRemark }}</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">商家备注:</span>
          <span>{{ order.remark }}</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">支付单号:</span>
          <span>{{ order.payOrderId }}</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">付款方式:</span>
          <DictTag
            :type="DICT_TYPE.PAY_CHANNEL_CODE"
            :value="order.payChannelCode"
          />
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">推广用户:</span>
          <span>{{ order.brokerageUser?.nickname }}</span>
        </div>
      </div>
    </ElCard>

    <!-- 订单状态 -->
    <ElCard class="mb-4">
      <template #header>
        <span class="font-bold">订单状态</span>
      </template>
      <div class="space-y-2">
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">订单状态:</span>
          <DictTag :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="order.status" />
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">提醒:</span>
          <div class="space-y-1">
            <div>买家付款成功后，货款将直接进入您的商户号（微信、支付宝）</div>
            <div>请及时关注你发出的包裹状态，确保可以配送至买家手中</div>
            <div>
              如果买家表示没收到货或货物有问题，请及时联系买家处理，友好协商
            </div>
          </div>
        </div>
      </div>
    </ElCard>

    <!-- 商品信息 -->
    <div class="mb-4">
      <ProductGrid table-title="商品信息">
        <template #spuName="{ row }">
          <div class="flex flex-1 flex-col items-start gap-1 text-left">
            <span class="text-sm">{{ row.spuName }}</span>
            <div class="flex flex-wrap gap-1">
              <ElTag
                v-for="(property, index) in row.properties"
                :key="index"
                size="small"
              >
                {{ property.propertyName }}: {{ property.valueName }}
              </ElTag>
            </div>
          </div>
        </template>
      </ProductGrid>
    </div>

    <!-- 费用信息 -->
    <ElCard class="mb-4">
      <template #header>
        <span class="font-bold">费用信息</span>
      </template>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">商品总额:</span>
          <span>{{ fenToYuan(order.totalPrice ?? 0) }} 元</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">运费金额:</span>
          <span>{{ fenToYuan(order.deliveryPrice ?? 0) }} 元</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">订单调价:</span>
          <span>{{ fenToYuan(order.adjustPrice ?? 0) }} 元</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">优惠劵优惠:</span>
          <span class="text-red-500">{{ fenToYuan(order.couponPrice ?? 0) }} 元</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">VIP 优惠:</span>
          <span class="text-red-500">{{ fenToYuan(order.vipPrice ?? 0) }} 元</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">活动优惠:</span>
          <span class="text-red-500">{{ fenToYuan(order.discountPrice ?? 0) }} 元</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">积分抵扣:</span>
          <span class="text-red-500">{{ fenToYuan(order.pointPrice ?? 0) }} 元</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">应付金额:</span>
          <span>{{ fenToYuan(order.payPrice ?? 0) }} 元</span>
        </div>
      </div>
    </ElCard>

    <!-- 收货信息 -->
    <ElCard class="mb-4">
      <template #header>
        <span class="font-bold">收货信息</span>
      </template>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">配送方式:</span>
          <DictTag
            :type="DICT_TYPE.TRADE_DELIVERY_TYPE"
            :value="order.deliveryType"
          />
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">收货人:</span>
          <span>{{ order.receiverName }}</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">联系电话:</span>
          <span>{{ order.receiverMobile }}</span>
        </div>
        <div class="flex md:col-span-3">
          <span class="mr-2 min-w-fit text-gray-600">收货地址:</span>
          <span>{{ order.receiverAreaName }}
            {{ order.receiverDetailAddress }}</span>
        </div>
        <div class="flex">
          <span class="mr-2 min-w-fit text-gray-600">发货时间:</span>
          <span>{{ formatDateTime(order.deliveryTime || '') }}</span>
        </div>
      </div>
    </ElCard>

    <!-- 物流详情 -->
    <div v-if="expressTrackList.length > 0" class="mt-4">
      <ExpressTrackGrid table-title="物流详情" />
    </div>

    <!-- 操作日志 -->
    <div>
      <OperateLogGrid table-title="操作日志">
        <template #userType="{ row }">
          <ElTag v-if="row.userId === 0" type="info"> 系统 </ElTag>
          <DictTag v-else :type="DICT_TYPE.USER_TYPE" :value="row.userType" />
        </template>
      </OperateLogGrid>
    </div>
  </Page>
</template>
