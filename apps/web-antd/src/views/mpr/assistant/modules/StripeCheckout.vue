<script lang="ts" setup>
import type { PaymentApi } from '#/api/mpr/payment';

import { onMounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { loadStripe } from '@stripe/stripe-js';
import { Card, message } from 'ant-design-vue';

import { createCheckout } from '#/api/mpr/payment';

const emit = defineEmits<{
  (e: 'complete'): void;
}>();

// const _loading = ref(false);
const data = ref();

// 创建对 stripe 和 elements 的引用
const stripe = ref(null);
const checkoutRef = ref(null);
const checkout = ref(null);

// 初始化 Stripe 和 Stripe Elements
onMounted(async () => {
  stripe.value = await loadStripe(
    'pk_test_51SHi5gIBKQJtbi39G6OrHoqZHDtOqxiGXxYsjtHIO5UbhanM9x4qE5QLWVptPoWjleBMqu2iPDuOXIiwvSmg9Uu600LQC6rYsj',
  ); // 使用你的 Publishable Key
});

const showError = ref(false);
const errorMsg = ref(null);

// 处理支付的函数
const fetchClientSecret = async () => {
  try {
    modalApi.setState({ loading: true });
    // 如果重新支付的 不用后端生成
    let clientSecret = null;
    if (data.value.clientSecret) {
      clientSecret = await data.value.clientSecret;
    } else {
      // 调用后端创建 PaymentIntent
      const payment = {
        id: data.value.id,
        billingType: data.value.billingType,
      } as PaymentApi.Payment;
      clientSecret = await createCheckout(payment);
    }

    checkout.value = await stripe.value.initEmbeddedCheckout({
      clientSecret,
      onComplete: handleComplete,
    });

    // Mount Checkout
    checkout.value.mount(checkoutRef.value);
    // eslint-disable-next-line no-unused-vars
    const _sessionId = checkout.value.embeddedCheckout.checkoutSessionId;

    if (data.value.clientSecret) {
      // ?
    }
    // emit('complete',sessionId)
    // emit('complete','cs_test_a1TWVsXmvD78jTj0B7Sqf7ZRgQVB8GsGdnyNvTHhQwb9XWhaGus3NaT7Ii');
  } catch (error) {
    console.error(error);
    showError.value = true;
    errorMsg.value = error.msg;
    // Modal.error({
    //   title: '支付失败',
    //   content: error.msg,
    //   onOk: ()=>{
    //     modalApi.close();
    //   }
    // });
  } finally {
    modalApi.setState({ loading: false });
  }
};
const handleComplete = async function () {
  const sessionId = checkout.value.embeddedCheckout.checkoutSessionId;

  emit('complete', sessionId);
  // Destroy Checkout instance
  // checkout.value.destroy()
  // Retrieve details from server (which loads Checkout Session)
  // const details = await retrievePurchaseDetails();

  // Show custom purchase summary
  // showPurchaseSummary(details);
};

const blur = ref(5);
const [Modal1, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  destroyOnClose: true,
  onCancel() {
    modalApi.close();
  },
  onClosed() {
    if (checkout.value) {
      checkout.value.unmount();
      checkout.value.destroy();
    }
  },
  onConfirm() {
    message.info('onConfirm');
    // modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      data.value = modalApi.getData<Record<string, any>>();
      if (stripe.value) {
        fetchClientSecret();
      }
    }
  },
  overlayBlur: blur.value,
});

const onClose = (_e: MouseEvent) => {
  modalApi.close();
};

watch(blur, (val) => {
  modalApi.setState({
    overlayBlur: val,
  });
});
</script>
<template>
  <Modal1 class="w-3/4" title="选择付款方式">
    <Card>
      <a-alert
        v-if="showError"
        message="支付失败"
        :description="errorMsg"
        type="error"
        closable
        @close="onClose"
      />
      <!-- Display a payment form -->
      <div ref="checkoutRef">
        <!-- Checkout will insert the payment form here -->
      </div>
    </Card>
  </Modal1>
</template>
