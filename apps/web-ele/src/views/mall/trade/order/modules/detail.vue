<script lang="ts" setup>
import type { MallDeliveryExpressApi } from '#/api/mall/trade/delivery/express';
import type { MallDeliveryPickUpStoreApi } from '#/api/mall/trade/delivery/pickUpStore';
import type { MallOrderApi } from '#/api/mall/trade/order';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { fenToYuan, formatDate } from '@vben/utils';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

import * as DeliveryExpressApi from '#/api/mall/trade/delivery/express';
import * as DeliveryPickUpStoreApi from '#/api/mall/trade/delivery/pickUpStore';
import * as TradeOrderApi from '#/api/mall/trade/order';
import ContentWrap from '#/components/content-wrap/content-wrap.vue';
import { DictTag } from '#/components/dict-tag';
import { DeliveryTypeEnum, TradeOrderStatusEnum } from '#/utils/constants';
import { DICT_TYPE, getDictLabel, getDictObj } from '#/utils/dict';

import OrderDeliveryForm from './delevery-form.vue';
import OrderUpdateAddressForm from './update-address-form.vue';
import OrderUpdatePriceForm from './update-price-form.vue';
import OrderUpdateRemarkForm from './update-remark-form.vue';

defineOptions({ name: 'TradeOrderDetail' });

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

const [OrderDeliveryFormModal, formModalApi] = useVbenModal({
  connectedComponent: OrderDeliveryForm,
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

// 订单详情
const formData = ref<MallOrderApi.Order>({
  logs: [],
});

/** 各种操作 */
const remark = () => {
  remarkFormModalApi.setData(formData.value).open();
};

const delivery = () => {
  formModalApi.setData(formData.value).open();
};
const updateAddress = () => {
  addressFormModalApi.setData(formData.value).open();
};

const updatePrice = () => {
  priceFormModalApi.setData(formData.value).open();
};

/** 核销 */
const handlePickUp = async () => {
  // 二次确认
  await confirm(`确认核销订单吗？`);
  await TradeOrderApi.pickUpOrder(formData.value.id!);
  ElMessage.success('核销成功');
  // 刷新列表
  await getDetail();
};

/** 获得详情 */
const { params } = useRoute();
const id = (params.id || props.id) as unknown as number;
const getDetail = async () => {
  if (id) {
    const res = (await TradeOrderApi.getOrder(id)) as MallOrderApi.Order;
    // 没有表单信息则关闭页面返回
    if (!res) {
      ElMessage.error('交易订单不存在');
      close();
    }
    formData.value = res;
  }
};

/** 关闭 tag */
const { push } = useRouter(); // 路由
const close = () => {
  push({ name: 'TradeOrder' });
};

/** 复制 */
const clipboardSuccess = () => {
  ElMessage.success('复制成功');
};

/** 初始化 */
const deliveryExpressList = ref<MallDeliveryExpressApi.SimpleDeliveryExpress[]>(
  [],
);
// 物流公司
const expressTrackList = ref<MallOrderApi.OrderExpressTrackRespDTO[]>([]); // 物流详情
const pickUpStore = ref<MallDeliveryPickUpStoreApi.PickUpStore>(
  {} as MallDeliveryPickUpStoreApi.PickUpStore,
); // 自提门店
onMounted(async () => {
  await getDetail();
  // 如果配送方式为快递，则查询物流公司
  if (formData.value.deliveryType === DeliveryTypeEnum.EXPRESS.type) {
    deliveryExpressList.value =
      await DeliveryExpressApi.getSimpleDeliveryExpressList();
    if (formData.value.logisticsId) {
      expressTrackList.value = await TradeOrderApi.getExpressTrackList(
        formData.value.id!,
      );
    }
  } else if (
    formData.value.deliveryType === DeliveryTypeEnum.PICK_UP.type &&
    formData.value.pickUpStoreId
  ) {
    pickUpStore.value = await DeliveryPickUpStoreApi.getDeliveryPickUpStore(
      formData.value.pickUpStoreId,
    );
  }
});
</script>
<template>
  <Page auto-content-height>
    <ContentWrap>
      <!-- 订单信息 -->
      <ElDescriptions title="订单信息">
        <ElDescriptionsItem label="订单号: ">
          {{ formData.no }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="买家: ">
          {{ formData?.user?.nickname }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单类型: ">
          <DictTag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="formData.type!" />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单来源: ">
          <DictTag :type="DICT_TYPE.TERMINAL" :value="formData.terminal!" />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="买家留言: ">
          {{ formData.userRemark }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="商家备注: ">
          {{ formData.remark }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="支付单号: ">
          {{ formData.payOrderId }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="付款方式: ">
          <DictTag
            :type="DICT_TYPE.PAY_CHANNEL_CODE"
            :value="formData.payChannelCode!"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="formData.brokerageUser" label="推广用户: ">
          {{ formData.brokerageUser?.nickname }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 订单状态 -->
      <ElDescriptions :column="1" title="订单状态">
        <ElDescriptionsItem label="订单状态: ">
          <DictTag
            :type="DICT_TYPE.TRADE_ORDER_STATUS"
            :value="formData.status!"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem
          v-hasPermi="['trade:order:update']"
          label-class-name="no-colon"
        >
          <el-button
            v-if="formData.status! === TradeOrderStatusEnum.UNPAID.status"
            type="primary"
            @click="updatePrice"
          >
            调整价格
          </el-button>
          <el-button type="primary" @click="remark">备注</el-button>
          <!-- 待发货 -->
          <template
            v-if="formData.status! === TradeOrderStatusEnum.UNDELIVERED.status"
          >
            <!-- 快递发货 -->
            <el-button
              v-if="formData.deliveryType === DeliveryTypeEnum.EXPRESS.type"
              type="primary"
              @click="delivery"
            >
              发货
            </el-button>
            <el-button
              v-if="formData.deliveryType === DeliveryTypeEnum.EXPRESS.type"
              type="primary"
              @click="updateAddress"
            >
              修改地址
            </el-button>
            <!-- 到店自提 -->
            <el-button
              v-if="
                formData.deliveryType === DeliveryTypeEnum.PICK_UP.type &&
                showPickUp
              "
              type="primary"
              @click="handlePickUp"
            >
              核销
            </el-button>
          </template>
        </ElDescriptionsItem>
        <ElDescriptionsItem>
          <template #label>
            <span style="color: red">提醒: </span>
          </template>
          <el-text>
            买家付款成功后，货款将直接进入您的商户号（微信、支付宝）<br />
            请及时关注你发出的包裹状态，确保可以配送至买家手中 <br />
            如果买家表示没收到货或货物有问题，请及时联系买家处理，友好协商
          </el-text>
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 商品信息 -->
      <ElDescriptions title="商品信息">
        <ElDescriptionsItem label-class-name="no-colon">
          <el-row :gutter="20">
            <el-col :span="15">
              <el-table :data="formData.items" border>
                <el-table-column label="商品" prop="spuName" width="auto">
                  <template #default="{ row }">
                    {{ row.spuName }}
                    <el-tag
                      v-for="property in row.properties"
                      :key="property.propertyId"
                    >
                      {{ property.propertyName }}: {{ property.valueName }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="商品原价" prop="price" width="150">
                  <template #default="{ row }">
                    {{ fenToYuan(row.price) }}元
                  </template>
                </el-table-column>
                <el-table-column label="数量" prop="count" width="100" />
                <el-table-column label="合计" prop="payPrice" width="150">
                  <template #default="{ row }">
                    {{ fenToYuan(row.payPrice) }}元
                  </template>
                </el-table-column>
                <el-table-column
                  label="售后状态"
                  prop="afterSaleStatus"
                  width="120"
                >
                  <template #default="{ row }">
                    <DictTag
                      :type="DICT_TYPE.TRADE_ORDER_ITEM_AFTER_SALE_STATUS"
                      :value="row.afterSaleStatus"
                    />
                  </template>
                </el-table-column>
              </el-table>
            </el-col>
            <el-col :span="10" />
          </el-row>
        </ElDescriptionsItem>
      </ElDescriptions>
      <ElDescriptions :column="4">
        <!-- 第一层 -->
        <ElDescriptionsItem label="商品总额: ">
          {{ fenToYuan(formData.totalPrice!) }} 元
        </ElDescriptionsItem>
        <ElDescriptionsItem label="运费金额: ">
          {{ fenToYuan(formData.deliveryPrice!) }} 元
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单调价: ">
          {{ fenToYuan(formData.adjustPrice!) }} 元
        </ElDescriptionsItem>
        <ElDescriptionsItem
          v-for="item in 1"
          :key="item"
          label-class-name="no-colon"
        />
        <!-- 第二层 -->
        <ElDescriptionsItem>
          <template #label>
            <span style="color: red">优惠劵优惠: </span>
          </template>
          {{ fenToYuan(formData.couponPrice!) }} 元
        </ElDescriptionsItem>
        <ElDescriptionsItem>
          <template #label><span style="color: red">VIP 优惠: </span></template>
          {{ fenToYuan(formData.vipPrice!) }} 元
        </ElDescriptionsItem>
        <ElDescriptionsItem>
          <template #label><span style="color: red">活动优惠: </span></template>
          {{ fenToYuan(formData.discountPrice!) }} 元
        </ElDescriptionsItem>
        <ElDescriptionsItem>
          <template #label><span style="color: red">积分抵扣: </span></template>
          {{ fenToYuan(formData.pointPrice!) }} 元
        </ElDescriptionsItem>
        <!-- 第三层 -->
        <ElDescriptionsItem
          v-for="item in 3"
          :key="item"
          label-class-name="no-colon"
        />
        <ElDescriptionsItem label="应付金额: ">
          {{ fenToYuan(formData.payPrice!) }} 元
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 物流信息 -->
      <ElDescriptions :column="4" title="收货信息">
        <ElDescriptionsItem label="配送方式: ">
          <DictTag
            :type="DICT_TYPE.TRADE_DELIVERY_TYPE"
            :value="formData.deliveryType!"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="收货人: ">
          {{ formData.receiverName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="联系电话: ">
          {{ formData.receiverMobile }}
        </ElDescriptionsItem>
        <!-- 快递配送 -->
        <div v-if="formData.deliveryType === DeliveryTypeEnum.EXPRESS.type">
          <ElDescriptionsItem
            v-if="formData.receiverDetailAddress"
            label="收货地址: "
          >
            {{ formData.receiverAreaName }} {{ formData.receiverDetailAddress }}
            <el-link
              v-clipboard:copy="
                `${formData.receiverAreaName} ${formData.receiverDetailAddress}`
              "
              v-clipboard:success="clipboardSuccess"
              icon="ep:document-copy"
              type="primary"
            />
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="formData.logisticsId" label="物流公司: ">
            {{
              deliveryExpressList.find(
                (item) => item.id === formData.logisticsId,
              )?.name
            }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="formData.logisticsId" label="运单号: ">
            {{ formData.logisticsNo }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="formData.deliveryTime" label="发货时间: ">
            {{ formatDate(formData.deliveryTime) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem
            v-for="item in 2"
            :key="item"
            label-class-name="no-colon"
          />
          <ElDescriptionsItem
            v-if="expressTrackList.length > 0"
            label="物流详情: "
          >
            <ElTimeline>
              <ElTimelineItem
                v-for="(express, index) in expressTrackList"
                :key="index"
                :timestamp="formatDate(express.time)?.toString()"
              >
                {{ express.content }}
              </ElTimelineItem>
            </ElTimeline>
          </ElDescriptionsItem>
        </div>
        <!-- 自提门店 -->
        <div v-if="formData.deliveryType === DeliveryTypeEnum.PICK_UP.type">
          <ElDescriptionsItem v-if="formData.pickUpStoreId" label="自提门店: ">
            {{ pickUpStore?.name }}
          </ElDescriptionsItem>
        </div>
      </ElDescriptions>

      <!-- 订单日志 -->
      <ElDescriptions title="订单操作日志">
        <ElDescriptionsItem label-class-name="no-colon">
          <ElTimeline>
            <ElTimelineItem
              v-for="(log, index) in formData.logs"
              :key="index"
              :timestamp="formatDate(log.createTime!)!.toString()"
              placement="top"
            >
              <div class="el-timeline-right-content">
                {{ log.content }}
              </div>
              <template #dot>
                <span
                  :style="{ backgroundColor: getUserTypeColor(log.userType!) }"
                  class="dot-node-style"
                >
                  {{ getDictLabel(DICT_TYPE.USER_TYPE, log.userType)[0] }}
                </span>
              </template>
            </ElTimelineItem>
          </ElTimeline>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ContentWrap>

    <!-- 各种操作的弹窗 -->
    <OrderDeliveryFormModal @success="getDetail" />
    <OrderUpdateRemarkFormModal @success="getDetail" />
    <OrderUpdateAddressFormModal @success="getDetail" />
    <OrderUpdatePriceFormModal @success="getDetail" />
  </Page>
</template>
<style lang="scss" scoped>
:deep(.el-descriptions) {
  &:not(:nth-child(1)) {
    margin-top: 20px;
  }

  .el-descriptions__title {
    display: flex;
    align-items: center;

    &::before {
      display: inline-block;
      width: 3px;
      height: 20px;
      margin-right: 10px;
      content: '';
      background-color: #409eff;
    }
  }

  .el-descriptions-item__container {
    margin: 0 10px;

    .no-colon {
      margin: 0;

      &::after {
        content: '';
      }
    }
  }
}

// 时间线样式调整
:deep(.el-timeline) {
  margin: 10px 0 0 160px;

  .el-timeline-item__wrapper {
    position: relative;
    top: -20px;

    .el-timeline-item__timestamp {
      position: absolute !important;
      top: 10px;
      left: -150px;
    }
  }
}

/* 单独定义气泡样式，不使用嵌套 */
:deep(.el-timeline-right-content) {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 30px;
  padding: 10px;
  margin-left: 10px;
  background-color: #f5f7fa; /* 使用明确的颜色替代变量 */
  border-radius: 4px;
}

:deep(.el-timeline-right-content)::before {
  position: absolute;
  top: 10px;
  left: -16px;
  content: '';
  border-color: transparent #f5f7fa transparent transparent;
  border-style: solid;
  border-width: 8px;
}

.dot-node-style {
  position: absolute;
  left: -5px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 10px;
  color: #fff;
  border-radius: 50%;
}
</style>
