<script lang="ts" setup>
import type { MallAfterSaleApi } from '#/api/mall/trade/afterSale';
import type { MallOrderApi } from '#/api/mall/trade/order';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { fenToYuan, formatDate } from '@vben/utils';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElImage,
  ElMessage,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

import * as AfterSaleApi from '#/api/mall/trade/afterSale/index';
import ContentWrap from '#/components/content-wrap/content-wrap.vue';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE, getDictLabel, getDictObj } from '#/utils/dict';

import UpdateAuditReasonForm from './disagree-form.vue';

defineOptions({ name: 'TradeAfterSaleDetail' });

const { params } = useRoute(); // 查询参数
const { push } = useRouter(); // 路由
const formData = ref<MallAfterSaleApi.AfterSale>({
  order: {} as MallOrderApi.Order,
  logs: [] as MallOrderApi.OrderLog[],
  orderItem: {} as MallOrderApi.OrderItem,
});
const updateAuditReasonFormRef = ref(); // 拒绝售后表单 Ref

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

/** 获得详情 */
const getDetail = async () => {
  const id = params.id as unknown as number;
  if (id) {
    const res = await AfterSaleApi.getAfterSale(id);
    // 没有表单信息则关闭页面返回
    if (res === null) {
      ElMessage.error('售后订单不存在');
      close();
    }
    formData.value = res;
  }
};

/** 同意售后 */
const agree = async () => {
  // 二次确认
  await confirm('是否同意售后？');
  await AfterSaleApi.agree(formData.value.id!);
  // 提示成功
  ElMessage.success($t('page.common.success'));
  await getDetail();
};

/** 拒绝售后 */
const disagree = async () => {
  updateAuditReasonFormRef.value?.open(formData.value);
};

/** 确认收货 */
const receive = async () => {
  // 二次确认
  await confirm('是否确认收货？');
  await AfterSaleApi.receive(formData.value.id!);
  // 提示成功
  ElMessage.success($t('page.common.success'));
  await getDetail();
};

/** 拒绝收货 */
const refuse = async () => {
  // 二次确认
  await confirm('是否拒绝收货？');
  await AfterSaleApi.refuse(formData.value.id!);
  // 提示成功
  ElMessage.success($t('page.common.success'));
  await getDetail();
};

/** 确认退款 */
const refund = async () => {
  // 二次确认
  await confirm('是否确认退款？');
  await AfterSaleApi.refund(formData.value.id!);
  // 提示成功
  ElMessage.success($t('page.common.success'));
  await getDetail();
};

/** 关闭 tag */
const close = () => {
  push({ name: 'TradeAfterSale' });
};
onMounted(async () => {
  await getDetail();
});
</script>
<template>
  <Page auto-content-height>
    <ContentWrap>
      <!-- 订单信息 -->
      <ElDescriptions title="订单信息">
        <ElDescriptionsItem label="订单号: ">
          {{ formData.orderNo }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="配送方式: ">
          <DictTag
            :type="DICT_TYPE.TRADE_DELIVERY_TYPE"
            :value="formData.order?.deliveryType"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单类型: ">
          <DictTag
            :type="DICT_TYPE.TRADE_ORDER_TYPE"
            :value="formData.order?.type"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="收货人: ">
          {{ formData.order?.receiverName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="买家留言: ">
          {{ formData.order?.userRemark }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单来源: ">
          <DictTag
            :type="DICT_TYPE.TERMINAL"
            :value="formData.order?.terminal"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="联系电话: ">
          {{ formData.order?.receiverMobile }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="商家备注: ">
          {{ formData.order?.remark }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="支付单号: ">
          {{ formData.order?.payOrderId }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="付款方式: ">
          <DictTag
            :type="DICT_TYPE.PAY_CHANNEL_CODE"
            :value="formData.order?.payChannelCode"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="买家: ">
          {{ formData?.user?.nickname }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 售后信息 -->
      <ElDescriptions title="售后信息">
        <ElDescriptionsItem label="退款编号: ">
          {{ formData.no }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="申请时间: ">
          {{ formatDate(formData.auditTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="售后类型: ">
          <DictTag
            :type="DICT_TYPE.TRADE_AFTER_SALE_TYPE"
            :value="formData.type"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="售后方式: ">
          <DictTag
            :type="DICT_TYPE.TRADE_AFTER_SALE_WAY"
            :value="formData.way"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="退款金额: ">
          {{ fenToYuan(formData.refundPrice ?? 0) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="退款原因: ">
          {{ formData.applyReason }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="补充描述: ">
          {{ formData.applyDescription }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="凭证图片: ">
          <ElImage
            v-for="(item, index) in formData.applyPicUrls"
            :key="index"
            :src="item"
            style="width: 60px; height: 60px; margin-right: 10px"
            :preview-src-list="formData.applyPicUrls ?? []"
          />
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 退款状态 -->
      <ElDescriptions :column="1" title="退款状态">
        <ElDescriptionsItem label="退款状态: ">
          <DictTag
            :type="DICT_TYPE.TRADE_AFTER_SALE_STATUS"
            :value="formData.status"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label-class-name="no-colon">
          <el-button
            v-if="formData.status === 10"
            type="primary"
            @click="agree"
          >
            同意售后
          </el-button>
          <el-button
            v-if="formData.status === 10"
            type="primary"
            @click="disagree"
          >
            拒绝售后
          </el-button>
          <el-button
            v-if="formData.status === 30"
            type="primary"
            @click="receive"
          >
            确认收货
          </el-button>
          <el-button
            v-if="formData.status === 30"
            type="primary"
            @click="refuse"
          >
            拒绝收货
          </el-button>
          <el-button
            v-if="formData.status === 40"
            type="primary"
            @click="refund"
          >
            确认退款
          </el-button>
        </ElDescriptionsItem>
        <ElDescriptionsItem>
          <template #label><span style="color: red">提醒: </span></template>
          如果未发货，请点击同意退款给买家。<br />
          如果实际已发货，请主动与买家联系。<br />
          如果订单整体退款后，优惠券和余额会退还给买家.
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 商品信息 -->
      <ElDescriptions title="商品信息">
        <ElDescriptionsItem label-class-name="no-colon">
          <el-row :gutter="20">
            <el-col :span="15">
              <el-table
                v-if="formData.orderItem"
                :data="[formData.orderItem]"
                border
              >
                <el-table-column label="商品" prop="spuName" width="auto">
                  <template #default="{ row }">
                    {{ row.spuName }}
                    <el-tag
                      v-for="property in row.properties"
                      :key="property.propertyId"
                      class="mr-10px"
                    >
                      {{ property.propertyName }}: {{ property.valueName }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="商品原价" prop="price" width="150">
                  <template #default="{ row }">
                    {{ fenToYuan(row.price) }} 元
                  </template>
                </el-table-column>
                <el-table-column label="数量" prop="count" width="100" />
                <el-table-column label="合计" prop="payPrice" width="150">
                  <template #default="{ row }">
                    {{ fenToYuan(row.payPrice) }} 元
                  </template>
                </el-table-column>
              </el-table>
            </el-col>
            <el-col :span="10" />
          </el-row>
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 操作日志 -->
      <ElDescriptions title="售后日志">
        <ElDescriptionsItem label-class-name="no-colon">
          <ElTimeline>
            <ElTimelineItem
              v-for="saleLog in formData.logs"
              :key="saleLog.id"
              :timestamp="formatDate(saleLog.createTime)?.toString()"
              placement="top"
            >
              <div class="el-timeline-right-content">
                <span>{{ saleLog.content }}</span>
              </div>
              <template #dot>
                <span
                  :style="{
                    backgroundColor: getUserTypeColor(saleLog.userType ?? 0),
                  }"
                  class="dot-node-style"
                >
                  {{
                    getDictLabel(DICT_TYPE.USER_TYPE, saleLog.userType)[0] ||
                    '系'
                  }}
                </span>
              </template>
            </ElTimelineItem>
          </ElTimeline>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ContentWrap>

    <!-- 各种操作的弹窗 -->
    <UpdateAuditReasonForm
      ref="updateAuditReasonFormRef"
      @success="getDetail"
    />
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
