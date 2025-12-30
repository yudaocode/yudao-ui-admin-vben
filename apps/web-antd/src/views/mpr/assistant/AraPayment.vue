<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';

import { getCheckoutSession } from '#/api/mpr/payment';

import PayReturn from './modules/PayReturn.vue';
import StripeCheckout from './modules/StripeCheckout.vue';

const route = useRoute(); // 路由

// 支付方式
// eslint-disable-next-line no-unused-vars
const _paymentMethod = ref('alipay');
const loading = ref(false);
const id = ref(null);
const complete = ref(false);
const payReturnRef = ref(null);
const sessionId = ref(null);
const clientSecret = ref(null);

function handlePay(value) {
  stripeModalApi
    .setData({
      id: id.value,
      billingType: value,
    })
    .open();
}

// 重新支付
function handleRepay(_value) {
  stripeModalApi
    .setData({
      id: id.value,
      clientSecret: clientSecret.value,
    })
    .open();
}

async function getCheckoutSessionInfo() {
  loading.value = true;
  try {
    const data = await getCheckoutSession(sessionId.value);
    clientSecret.value = data.clientSecret;
    payReturnRef.value.checkoutSession = data;
    complete.value = true;
  } finally {
    loading.value = false;
  }
}
function handleComplete(id) {
  sessionId.value = id;
  stripeModalApi.close();

  getCheckoutSessionInfo();
}

const [StripeModal, stripeModalApi] = useVbenModal({
  connectedComponent: StripeCheckout,
});

/** 初始化数据 */
async function initData() {
  if (route.query.id) {
    id.value = route.query.id as any;
  }
  if (!id.value) {
    //
  }
}

/** 初始化 */
onMounted(async () => {
  await initData();
});
</script>

<template>
  <Page v-loading="loading">
    <!-- 支付弹窗 -->
    <StripeModal @complete="handleComplete" />
    <!--  支付完成弹窗  -->
    <PayReturn ref="payReturnRef" v-show="complete" @repay="handleRepay" />

    <!-- 主内容区域 -->
    <div v-show="!complete" class="mx-auto max-w-7xl p-6 md:p-10">
      <!-- 页面标题 -->
      <div class="mb-12 text-center">
        <h1 class="text-dark mb-4 text-[clamp(1.8rem,4vw,2.8rem)] font-bold">
          Ara 配置已完成！
        </h1>
        <p class="text-light-dark mx-auto max-w-2xl text-lg">
          只差最后一步，完成付款后 Ara 将立即开始工作！
        </p>
        <h2 class="text-dark mb-4 text-2xl font-bold">选择最适合您的计划</h2>
        <p class="text-light-dark mx-auto max-w-2xl text-lg">
          您可以在"我的助理"页面查看Ara的工作进度
        </p>
      </div>

      <!-- 定价卡片容器 -->
      <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
        <!-- 3天试用 -->
        <div
          class="card-shadow card-hover rounded-xl border border-gray-100 bg-white p-6"
        >
          <div class="mb-6">
            <h2 class="mb-2 text-xl font-bold">3天试用</h2>
            <p class="text-light-dark">
              3天试用免费，3天后自动转为月费计划，随时可以取消；
            </p>
          </div>

          <div class="mb-6">
            <div class="flex items-end">
              <span class="text-4xl font-bold">免费</span>
              <span class="text-light-dark mb-1 ml-2"></span>
            </div>
            <p class="text-success mt-2 text-sm">
              <i class="fa fa-check-circle mr-1"></i>
            </p>
          </div>

          <ul class="mb-8 space-y-3">
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>一个助理可以搜索一个关键词</span>
            </li>
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>你可以随时更换关键词</span>
            </li>
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>每个助理每天可以最多联系20个卖家</span>
            </li>
            <li class="text-light-gray flex items-start">
              <i class="fa fa-times mr-2 mt-1"></i>
              <span>无API访问权限</span>
            </li>
          </ul>

          <button
            @click="handlePay('trial')"
            class="text-primary border-primary hover:bg-primary/5 w-full rounded-lg border bg-white px-4 py-3 font-medium transition-colors"
          >
            开始免费试用
          </button>
        </div>

        <!-- 月费计划 -->
        <div
          class="card-shadow card-hover border-primary relative transform rounded-xl border-2 bg-white p-6 md:-translate-y-4"
        >
          <div
            class="bg-primary absolute right-0 top-0 rounded-bl-lg px-3 py-1 text-xs font-bold text-white"
          >
            最受欢迎
          </div>

          <div class="mb-6">
            <h2 class="mb-2 text-xl font-bold">月费计划</h2>
            <p class="text-light-dark">
              每名助理每月收费 20
              美元，按月自动续费，可随时取消；一旦续费完成，当月费用将不予退还。
            </p>
          </div>

          <div class="mb-6">
            <div class="flex items-end">
              <span class="text-4xl font-bold">$20</span>
              <span class="text-light-dark mb-1 ml-2">/ 助理/月</span>
            </div>
            <p class="text-primary mt-2 text-sm">
              <i class="fa fa-info-circle mr-1"></i> 按月结算
            </p>
          </div>

          <ul class="mb-8 space-y-3">
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>该计划包含所有免费版的功能</span>
            </li>
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>提供 持续不间断的服务，让你的转卖业务全天候运行。</span>
            </li>
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>提供 持续的市场数据分析和价格趋势洞察</span>
            </li>
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>
                你还可以根据业务的增长
                灵活添加更多助理，同时处理更多关键词搜索与卖家沟通次数，全面提升运营效率。
              </span>
            </li>
          </ul>

          <button
            @click="handlePay('month')"
            class="bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-lg px-4 py-3 font-medium text-white transition-colors"
          >
            <i class="fa fa-credit-card mr-2"></i> 选择月费计划
          </button>
        </div>

        <!-- 六个月计划 -->
        <div
          class="card-shadow card-hover rounded-xl border border-gray-100 bg-white p-6"
        >
          <div class="mb-6">
            <h2 class="mb-2 text-xl font-bold">六个月计划</h2>
            <p class="text-light-dark">开启六个月的计划，减免一个月的费用；</p>
          </div>

          <div class="mb-6">
            <div class="flex items-end">
              <span class="text-4xl font-bold">$100</span>
              <span class="text-light-dark mb-1 ml-2">/ 助理/6个月</span>
            </div>
            <p class="text-success mt-2 text-sm">
              <i class="fa fa-tag mr-1"></i> 节省20%
            </p>
          </div>

          <ul class="mb-8 space-y-3">
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>一个助理六个月费用是$100；</span>
            </li>
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>
                一个助理一天可以搜索并联系二十个最新商品，如果需要搜索和联系更多商品，需要增加多个助理；
              </span>
            </li>
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>
                一个助理同一时间只能搜索一个商品，可以随时更换搜索商品，如果同一时间需要搜索多个商品，需要多个助理；
              </span>
            </li>
            <li class="flex items-start">
              <i class="fa fa-check text-success mr-2 mt-1"></i>
              <span>到期后自动取消。</span>
            </li>
          </ul>

          <button
            @click="handlePay('6month')"
            class="text-primary border-primary hover:bg-primary/5 w-full rounded-lg border bg-white px-4 py-3 font-medium transition-colors"
          >
            选择半年计划
          </button>
        </div>
      </div>

      <!-- 支付方式说明 -->
      <div class="card-shadow mt-12 rounded-xl bg-white p-6">
        <h3 class="mb-4 text-lg font-semibold">支付方式</h3>
        <div class="flex items-center">
          <img
            src="https://picsum.photos/id/237/40/25"
            alt="Stripe支付标志"
            class="mr-3 h-8"
          />
          <div>
            <p class="font-medium">我们使用Stripe安全处理所有支付</p>
            <p class="text-light-dark text-sm">
              所有付款信息均经过加密处理，安全可靠
            </p>
          </div>
        </div>
      </div>

      <!-- 常见问题 -->
      <div class="mt-12">
        <h3 class="mb-6 text-center text-xl font-bold">常见问题</h3>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="card-shadow rounded-lg bg-white p-5">
            <h4 class="mb-2 font-semibold">如何切换计划？</h4>
            <p class="text-light-dark">
              您可以随时在账户设置中切换计划，新计划将在下一个结算周期生效。
            </p>
          </div>

          <div class="card-shadow rounded-lg bg-white p-5">
            <h4 class="mb-2 font-semibold">是否提供发票？</h4>
            <p class="text-light-dark">
              是的，所有付费计划都会提供详细的电子发票，您可以在账户中下载。
            </p>
          </div>

          <div class="card-shadow rounded-lg bg-white p-5">
            <h4 class="mb-2 font-semibold">如何取消订阅？</h4>
            <p class="text-light-dark">
              您可以随时取消订阅，取消后当前计划将持续到结算周期结束。
            </p>
          </div>

          <div class="card-shadow rounded-lg bg-white p-5">
            <h4 class="mb-2 font-semibold">支持哪些货币？</h4>
            <p class="text-light-dark">
              目前我们支持美元、欧元、英镑等主要国际货币，系统会自动根据您的地区显示相应货币。
            </p>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>
