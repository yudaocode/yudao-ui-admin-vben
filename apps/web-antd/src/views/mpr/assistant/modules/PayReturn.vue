<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  CheckCircleFilled,
  CloseCircleFilled,
  CustomerServiceOutlined,
  ExclamationCircleFilled,
  EyeOutlined,
  HomeOutlined,
  RedoOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

// 类型定义
interface OrderInfo {
  orderNo: string;
  amount: number;
  productName: string;
  createTime: string;
  payTime?: string;
}

const emit = defineEmits<{
  (e: 'complete'): void;
  (e: 'repay'): void;
}>();
// 路由和状态
const route = useRoute();
const router = useRouter();
const paymentStatus = ref<'cancel' | 'error' | 'success'>('success');
const loading = ref(false);

const id = ref();
const sessionId = ref();
const checkoutSession = ref();

/** 暴露出表单校验方法和表单值获取方法 */
defineExpose({
  checkoutSession,
});
// 订单信息
const orderInfo = ref<OrderInfo>({
  orderNo: '202305200001',
  amount: 299,
  productName: 'VIP会员年费',
  createTime: '2023-05-20 10:30:15',
  payTime: '2023-05-20 10:31:22',
});

// 从URL参数获取支付状态
// eslint-disable-next-line no-unused-vars
const _getStatusFromUrl = () => {
  id.value = route.query.id;
  sessionId.value = route.query.sessionId;
  const status = route.query.status as string;
  if (status && ['cancel', 'error', 'success'].includes(status)) {
    paymentStatus.value = status as 'cancel' | 'error' | 'success';
  }
};

// 处理查看订单
const handleViewOrder = () => {
  message.success('跳转到订单详情页');
  // router.push(`/order/detail/${orderInfo.value.orderNo}`)
};

// 处理返回首页
const handleBackHome = () => {
  message.info('返回首页');
  router.push('/');
};

// 处理继续购物
// eslint-disable-next-line no-unused-vars
const _handleContinueShopping = () => {
  message.info('继续购物');
  router.push('/goods');
};

// 处理重新支付
const handleTryAgain = () => {
  message.loading({ content: '重新发起支付...', key: 'pay' });
  emit('repay');
};

// 处理联系客服
const handleContactService = () => {
  message.info('联系客服');
  // 实际项目中这里会打开客服对话框或跳转到客服页面
};
// 计算属性：根据 status 返回对应的类名
const statusClass = computed(() => {
  switch (paymentStatus.value) {
    case 'cancel': {
      return 'result-card cancel-card';
    }
    case 'error': {
      return 'result-card error-card';
    }
    case 'success': {
      return 'result-card success-card';
    }
    default: {
      return 'status-default';
    }
  }
});
// 组件挂载时获取状态
onMounted(() => {
  // getStatusFromUrl()

  // 模拟从API获取订单信息
  setTimeout(() => {
    // 这里可以调用API获取真实的订单信息
  }, 100);
});

// 当 count 变化时，主动通知父组件
watch(checkoutSession, (newVal) => {
  const payment_status = newVal.paymentStatus;
  const status = newVal.status;
  if (payment_status === 'paid') {
    paymentStatus.value = 'success';
  } else {
    if (status === 'open') {
      paymentStatus.value = 'cancel';
    } else if (status === 'expired') {
      paymentStatus.value = 'error';
    }
  }
});
</script>

<template>
  <Page v-loading="loading">
    <div class="p-4">
      <div class="payment-result">
        <!-- 支付成功状态 -->
        <a-card :class="statusClass">
          <div class="result-icon">
            <CheckCircleFilled
              v-if="paymentStatus === 'success'"
              class="success-icon"
            />
            <ExclamationCircleFilled
              v-else-if="paymentStatus === 'cancel'"
              class="cancel-icon"
            />
            <CloseCircleFilled
              v-else-if="paymentStatus === 'error'"
              class="error-icon"
            />
          </div>
          <div class="result-content">
            <template v-if="paymentStatus === 'success'">
              <h2 class="result-title">支付成功</h2>
              <p class="result-desc">您的订单已支付成功，我们将尽快为您处理</p>
            </template>
            <template v-else-if="paymentStatus === 'cancel'">
              <h2 class="result-title">支付取消</h2>
              <p class="result-desc">您已取消本次支付，订单将保留24小时</p>
            </template>
            <template v-else-if="paymentStatus === 'error'">
              <h2 class="result-title">支付失败</h2>
              <p class="result-desc">
                支付过程中出现错误，请检查支付信息或稍后重试
              </p>
            </template>
            <div class="order-info">
              <a-descriptions :column="2" bordered>
                <a-descriptions-item label="订单号">
                  {{ orderInfo.orderNo }}
                </a-descriptions-item>
                <a-descriptions-item label="支付金额">
                  <span class="amount">¥{{ orderInfo.amount.toFixed(2) }}</span>
                </a-descriptions-item>
                <a-descriptions-item label="商品名称">
                  {{ orderInfo.productName }}
                </a-descriptions-item>
                <a-descriptions-item label="支付时间">
                  {{ orderInfo.payTime }}
                </a-descriptions-item>
              </a-descriptions>
            </div>

            <div class="action-buttons">
              <a-space :size="16">
                <a-button
                  v-if="paymentStatus === 'success'"
                  size="large"
                  type="primary"
                  @click="handleViewOrder"
                >
                  <template #icon><EyeOutlined /></template>
                  查看订单
                </a-button>
                <a-button
                  v-if="paymentStatus !== 'success'"
                  size="large"
                  type="primary"
                  @click="handleTryAgain"
                >
                  <template #icon><RedoOutlined /></template>
                  重新支付
                </a-button>
                <a-button size="large" @click="handleBackHome">
                  <template #icon><HomeOutlined /></template>
                  返回首页
                </a-button>
                <a-button size="large" @click="handleContactService">
                  <template #icon><CustomerServiceOutlined /></template>
                  联系客服
                </a-button>
              </a-space>
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </Page>
</template>

<style scoped>
/* 响应式设计 */
@media (max-width: 768px) {
  .payment-result {
    margin: 0 16px;
  }

  .result-icon :deep(.anticon) {
    font-size: 56px;
  }

  .result-title {
    font-size: 20px;
  }

  .result-desc {
    font-size: 14px;
  }

  .action-buttons :deep(.ant-space) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .action-buttons :deep(.ant-btn) {
    width: 100%;
  }
}

.payment-result {
  max-width: 800px;
  margin: 0 auto;
}

.result-card {
  text-align: center;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
}

.success-card {
  border-color: #52c41a;
}

.cancel-card {
  border-color: #faad14;
}

.error-card {
  border-color: #ff4d4f;
}

.result-icon {
  margin-bottom: 24px;
}

.result-icon :deep(.anticon) {
  font-size: 72px;
}

.success-icon {
  color: #52c41a;
}

.cancel-icon {
  color: #faad14;
}

.error-icon {
  color: #ff4d4f;
}

.result-content {
  padding: 0 20px;
}

.result-title {
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
  color: rgb(0 0 0 / 85%);
}

.result-desc {
  margin-bottom: 32px;
  font-size: 16px;
  color: rgb(0 0 0 / 45%);
}

.error-tips {
  margin-bottom: 24px;
  text-align: left;
}

.order-info {
  margin: 32px 0;
}

.amount {
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4f;
}

.action-buttons {
  padding-bottom: 20px;
  margin-top: 32px;
}
</style>
