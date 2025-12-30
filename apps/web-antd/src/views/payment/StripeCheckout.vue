<script lang="ts" setup>
import type { PaymentApi } from '#/api/mpr/payment';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { loadStripe } from '@stripe/stripe-js';
import { Card, message } from 'ant-design-vue';

import { createCheckout } from '#/api/mpr/payment';

const loading = ref(false);

// 创建对 stripe 和 elements 的引用
const stripe = ref(null);
const checkoutRef = ref(null);

// 初始化 Stripe 和 Stripe Elements
onMounted(async () => {
  if (!stripe.value) {
    stripe.value = await loadStripe(
      'pk_test_51SHi5gIBKQJtbi39G6OrHoqZHDtOqxiGXxYsjtHIO5UbhanM9x4qE5QLWVptPoWjleBMqu2iPDuOXIiwvSmg9Uu600LQC6rYsj',
    ); // 使用你的 Publishable Key
    if (stripe.value) {
      await fetchClientSecret();
    }
  }
});

// 处理支付的函数
const fetchClientSecret = async () => {
  try {
    // 调用后端创建 PaymentIntent
    const payment = {
      amount: 1000,
    } as PaymentApi.Payment;
    const clientSecret = await createCheckout(payment);
    // console.log(clientSecret);

    const checkout = await stripe.value.initEmbeddedCheckout({
      clientSecret,
    });

    // Mount Checkout
    checkout.mount(checkoutRef.value);
  } catch (error) {
    console.error(error);
    message.error(`支付失败: ${error.message}`);
  }
};
</script>

<template>
  <Page v-loading="loading">
    <a-space direction="vertical" style="width: 100%; text-align: center">
      <a-typography-title :level="2">Stripe Payment</a-typography-title>
      <!-- 用于渲染卡片信息的容器 -->
      <Card>
        <!-- Display a payment form -->
        <div ref="checkoutRef">
          <!-- Checkout will insert the payment form here -->
        </div>
      </Card>
    </a-space>
  </Page>
</template>

<style scoped>
/* 你可以在这里自定义样式 */
</style>
