<script lang="ts" setup>
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
import { getDictLabel, getDictObj } from '@vben/hooks';
import { formatDate } from '@vben/utils';
import { useTabs } from '@vben/hooks';

import { Card, Tag, Timeline } from 'ant-design-vue';
import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import * as DeliveryExpressApi from '#/api/mall/trade/delivery/express';
import * as DeliveryPickUpStoreApi from '#/api/mall/trade/delivery/pickUpStore';
import * as TradeOrderApi from '#/api/mall/trade/order';
import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import { TableAction } from '#/components/table-action';

import DeliveryForm from '../modules/delevery-form.vue';
import OrderUpdateAddressForm from '../modules/update-address-form.vue';
import OrderUpdatePriceForm from '../modules/update-price-form.vue';
import OrderUpdateRemarkForm from '../modules/update-remark-form.vue';
import {
  useDeliveryInfoSchema,
  useOperateLogColumns,
  useOrderInfoSchema,
  useOrderPriceSchema,
  useOrderStatusSchema,
  useProductColumns,
} from './data';

defineOptions({ name: 'TradeOrderDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

// 查询参数
const props = defineProps({
  id: {
    type: Number,
    default: undefined,
  }, // 订单ID
  showPickUp: {
    type: Boolean,
    default: true,
  }, // 显示核销按钮
});

const loading = ref(false);
const orderId = ref(0);
const formData = ref<MallOrderApi.Order>({
  logs: [],
});

const deliveryExpressList = ref<MallDeliveryExpressApi.SimpleDeliveryExpress[]>([]);
const expressTrackList = ref<any[]>([]);
const pickUpStore = ref<MallDeliveryPickUpStoreApi.PickUpStore>(
  {} as MallDeliveryPickUpStoreApi.PickUpStore,
);

// Description 组件
const [OrderInfoDescriptions] = useDescription({
  componentProps: {
    title: '订单信息',
    bordered: false,
    column: 3,
  },
  schema: useOrderInfoSchema(),
});

const [OrderStatusDescriptions] = useDescription({
  componentProps: {
    title: '订单状态',
    bordered: false,
    column: 2,
  },
  schema: useOrderStatusSchema(),
});

const [OrderPriceDescriptions] = useDescription({
  componentProps: {
    title: '费用信息',
    bordered: false,
    column: 4,
  },
  schema: useOrderPriceSchema(),
});

const [DeliveryInfoDescriptions] = useDescription({
  componentProps: {
    title: '收货信息',
    bordered: false,
    column: 3,
  },
  schema: useDeliveryInfoSchema(),
});

// Grid 组件
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
  },
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
  },
});

// Modal 组件
const [DeliveryFormModal, deliveryFormModalApi] = useVbenModal({
  connectedComponent: DeliveryForm,
  destroyOnClose: true,
});

const [OrderUpdateRemarkFormModal, remarkFormModalApi] = useVbenModal({
  connectedComponent: OrderUpdateRemarkForm,
  destroyOnClose: true,
});

const [OrderUpdateAddressFormModal, addressFormModalApi] = useVbenModal({
  connectedComponent: OrderUpdateAddressForm,
  destroyOnClose: true,
});

const [OrderUpdatePriceFormModal, priceFormModalApi] = useVbenModal({
  connectedComponent: OrderUpdatePriceForm,
  destroyOnClose: true,
});

/** 获得 userType 颜色 */
const getUserTypeColor = (type: number) => {
  const dict = getDictObj(DICT_TYPE.USER_TYPE, type);
  switch (dict?.colorType) {
    case 'danger': {
      return '#F56C6C';
    }
    case 'info': {
      return '#909399';
    }
    case 'success': {
      return '#67C23A';
    }
    case 'warning': {
      return '#E6A23C';
    }
  }
  return '#409EFF';
};

/** 各种操作 */
const handleRemark = () => {
  remarkFormModalApi.setData(formData.value).open();
};

const handleDelivery = () => {
  deliveryFormModalApi.setData(formData.value).open();
};

const handleUpdateAddress = () => {
  addressFormModalApi.setData(formData.value).open();
};

const handleUpdatePrice = () => {
  priceFormModalApi.setData(formData.value).open();
};

/** 核销 */
const handlePickUp = async () => {
  await confirm('确认核销订单吗？');
  const hideLoading = message.loading({
    content: '正在处理中...',
    duration: 0,
  });
  try {
    await TradeOrderApi.pickUpOrder(formData.value.id!);
    message.success('核销成功');
    await getDetail();
  } finally {
    hideLoading();
  }
};

/** 获得详情 */
const getDetail = async () => {
  loading.value = true;
  try {
    const res = await TradeOrderApi.getOrder(orderId.value);
    if (!res) {
      message.error('交易订单不存在');
      handleBack();
      return;
    }
    formData.value = res;
    productGridApi.setGridOptions({ data: res.items || [] });
    operateLogGridApi.setGridOptions({ data: res.logs || [] });

    // 如果配送方式为快递，则查询物流公司
    if (res.deliveryType === DeliveryTypeEnum.EXPRESS.type) {
      deliveryExpressList.value = await DeliveryExpressApi.getSimpleDeliveryExpressList();
      if (res.logisticsId) {
        expressTrackList.value = await TradeOrderApi.getExpressTrackList(res.id!);
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
};

/** 返回列表页 */
function handleBack() {
  tabs.closeCurrentTab();
  router.push('/mall/trade/order');
}


/** 初始化 */
onMounted(async () => {
  orderId.value = Number(route.params.id) || props.id || 0;
  if (orderId.value) {
    await getDetail();
  }
});
</script>

<template>
  <Page auto-content-height :title="formData.no" :loading="loading">
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
            ifShow: formData.status === TradeOrderStatusEnum.UNPAID.status,
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
              formData.status === TradeOrderStatusEnum.UNDELIVERED.status &&
              formData.deliveryType === DeliveryTypeEnum.EXPRESS.type,
          },
          {
            label: '修改地址',
            type: 'primary',
            onClick: handleUpdateAddress,
            ifShow:
              formData.status === TradeOrderStatusEnum.UNDELIVERED.status &&
              formData.deliveryType === DeliveryTypeEnum.EXPRESS.type,
          },
          {
            label: '核销',
            type: 'primary',
            onClick: handlePickUp,
            ifShow:
              formData.status === TradeOrderStatusEnum.UNDELIVERED.status &&
              formData.deliveryType === DeliveryTypeEnum.PICK_UP.type &&
              showPickUp,
          },
        ]"
      />
    </template>

    <!-- 各种操作的弹窗 -->
    <DeliveryFormModal @success="getDetail" />
    <OrderUpdateRemarkFormModal @success="getDetail" />
    <OrderUpdateAddressFormModal @success="getDetail" />
    <OrderUpdatePriceFormModal @success="getDetail" />

    <!-- 订单信息 -->
    <Card class="mb-4">
      <OrderInfoDescriptions :data="formData" />
    </Card>

    <!-- 订单状态 -->
    <Card class="mb-4">
      <OrderStatusDescriptions :data="formData" />
    </Card>

    <!-- 商品信息 -->
    <div class="mb-4">
      <ProductGrid table-title="商品信息">
        <template #spuName="{ row }">
          <div class="flex flex-1 flex-col items-start gap-1 text-left">
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
        <template #afterSaleStatus="{ row }">
          <DictTag
            :type="DICT_TYPE.TRADE_ORDER_ITEM_AFTER_SALE_STATUS"
            :value="row.afterSaleStatus"
          />
        </template>
      </ProductGrid>
    </div>

    <!-- 费用信息 -->
    <Card class="mb-4">
      <OrderPriceDescriptions :data="formData" />
    </Card>

    <!-- 收货信息 -->
    <Card class="mb-4">
      <DeliveryInfoDescriptions :data="formData" />
      <!-- 物流详情 -->
      <div v-if="expressTrackList.length > 0" class="mt-4">
        <h4 class="mb-2 font-semibold">物流详情</h4>
        <Timeline>
          <Timeline.Item
            v-for="(track, index) in expressTrackList"
            :key="index"
          >
            <template #dot>
              <div class="h-2 w-2 rounded-full bg-blue-500"></div>
            </template>
            <div>
              <div class="text-sm text-gray-600">
                {{ formatDate(track.time) }}
              </div>
              <div class="text-sm">{{ track.content }}</div>
            </div>
          </Timeline.Item>
        </Timeline>
      </div>
    </Card>

    <!-- 操作日志 -->
    <div>
      <OperateLogGrid table-title="操作日志">
        <template #userType="{ row }">
          <Tag
            v-if="row.userId === 0"
            color="default"
          >
            系统
          </Tag>
          <div v-else class="flex items-center gap-2">
            <span
              :style="{ backgroundColor: getUserTypeColor(row.userType!) }"
              class="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
            >
              {{ getDictLabel(DICT_TYPE.USER_TYPE, row.userType)[0] }}
            </span>
            <DictTag :type="DICT_TYPE.USER_TYPE" :value="row.userType" />
          </div>
        </template>
      </OperateLogGrid>
    </div>
  </Page>
</template>