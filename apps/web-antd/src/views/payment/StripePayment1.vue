<script lang="ts" setup>
import type { PaymentApi } from '#/api/mpr/payment';

import { onMounted, ref } from 'vue';

import { loadStripe } from '@stripe/stripe-js';
import { message } from 'ant-design-vue';

import { createPaymentIntent } from '#/api/mpr/payment';

// 创建对 stripe 和 elements 的引用
const stripe = ref(null);
const elements = ref(null);
const card = ref(null);
const cardElementRef = ref(null);

// 初始化 Stripe 和 Stripe Elements
onMounted(async () => {
  stripe.value = await loadStripe(
    'pk_test_51SHi5gIBKQJtbi39G6OrHoqZHDtOqxiGXxYsjtHIO5UbhanM9x4qE5QLWVptPoWjleBMqu2iPDuOXIiwvSmg9Uu600LQC6rYsj',
  ); // 使用你的 Publishable Key
  if (stripe.value) {
    elements.value = stripe.value.elements();
    card.value = elements.value.create('card');
    card.value.mount(cardElementRef.value); // 渲染卡片信息元素
  }
});

// 处理支付的函数
const handlePayment = async () => {
  try {
    // 调用后端创建 PaymentIntent
    const payment = {
      amount: 1000,
    } as PaymentApi.Payment;
    const clientSecret = await createPaymentIntent(payment);
    // console.log(clientSecret);

    // 使用 Stripe Elements 创建支付方式
    if (stripe.value && card.value) {
      const { error, paymentIntent } = await stripe.value.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: card.value,
            billing_details: {
              name: 'Test User', // 根据需要填写其他信息
            },
          },
        },
      );

      if (error) {
        message.error(`支付失败: ${error.message}`);
      } else if (paymentIntent?.status === 'succeeded') {
        message.success('支付成功！');
      }
    }
  } catch (error) {
    message.error(`支付失败: ${error.message}`);
  }
};
</script>

<template>
  <a-space direction="vertical" style="width: 100%; text-align: center">
    <a-typography-title :level="2">Stripe Payment</a-typography-title>

    <div ref="cardElementRef"></div>
    <!-- 用于渲染卡片信息的容器 -->

    <a-button type="primary" @click="handlePayment">支付 $10</a-button>
  </a-space>
</template>

<style scoped>
/* 你可以在这里自定义样式 */
</style>
