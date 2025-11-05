<!-- 右侧信息：会员信息 + 最近浏览 + 交易订单 -->
<script lang="ts" setup>
import type { UseScrollReturn } from '@vueuse/core';

import type { MallKefuConversationApi } from '#/api/mall/promotion/kefu/conversation';
import type { MemberUserApi } from '#/api/member/user';
import type { PayWalletApi } from '#/api/pay/wallet/balance';

import { computed, nextTick, ref } from 'vue';

import { isEmpty } from '@vben/utils';

import { vScroll } from '@vueuse/components';
import { useDebounceFn } from '@vueuse/core';
import { Card, Empty, Layout, message } from 'ant-design-vue';

import { getUser } from '#/api/member/user';
import { getWallet } from '#/api/pay/wallet/balance';
import AccountInfo from '#/views/member/user/detail/modules/account-info.vue';
import BasicInfo from '#/views/member/user/detail/modules/basic-info.vue';

import OrderBrowsingHistory from './order-browsing-history.vue';
import ProductBrowsingHistory from './product-browsing-history.vue';

const activeTab = ref<string>('会员信息');

const tabActivation = computed(() => (tab: string) => activeTab.value === tab);

/** tab 切换 */
const productBrowsingHistoryRef =
  ref<InstanceType<typeof ProductBrowsingHistory>>();
const orderBrowsingHistoryRef =
  ref<InstanceType<typeof OrderBrowsingHistory>>();
async function handleClick(tab: string) {
  activeTab.value = tab;
  await nextTick();
  await getHistoryList();
}

/** 获得历史数据 */
async function getHistoryList() {
  switch (activeTab.value) {
    case '交易订单': {
      await orderBrowsingHistoryRef.value?.getHistoryList(conversation.value);
      break;
    }
    case '会员信息': {
      await getUserData();
      await getUserWallet();
      break;
    }
    case '最近浏览': {
      await productBrowsingHistoryRef.value?.getHistoryList(conversation.value);
      break;
    }
    default: {
      break;
    }
  }
}

/** 加载下一页数据 */
async function loadMore() {
  switch (activeTab.value) {
    case '交易订单': {
      await orderBrowsingHistoryRef.value?.loadMore();
      break;
    }
    case '会员信息': {
      break;
    }
    case '最近浏览': {
      await productBrowsingHistoryRef.value?.loadMore();
      break;
    }
    default: {
      break;
    }
  }
}

/** 浏览历史初始化 */
const conversation = ref<MallKefuConversationApi.Conversation>(
  {} as MallKefuConversationApi.Conversation,
); // 用户会话
async function initHistory(val: MallKefuConversationApi.Conversation) {
  activeTab.value = '会员信息';
  conversation.value = val;
  await nextTick();
  await getHistoryList();
}
defineExpose({ initHistory });

/** 处理消息列表滚动事件(debounce 限流) */
const scrollbarRef = ref<InstanceType<any>>();
const handleScroll = useDebounceFn(async (state: UseScrollReturn) => {
  const { arrivedState } = state;
  if (arrivedState.bottom) {
    await loadMore();
  }
}, 200);

/** 查询用户钱包信息 */
// TODO @jawe：idea 的导入报错；需要看下；
const WALLET_INIT_DATA = {
  balance: 0,
  totalExpense: 0,
  totalRecharge: 0,
} as PayWalletApi.Wallet; // 钱包初始化数据
const wallet = ref<PayWalletApi.Wallet>(WALLET_INIT_DATA); // 钱包信息

async function getUserWallet() {
  if (!conversation.value.userId) {
    wallet.value = WALLET_INIT_DATA;
    return;
  }
  wallet.value =
    (await getWallet({ userId: conversation.value.userId })) ||
    WALLET_INIT_DATA;
}

/** 获得用户 */
const loading = ref(true); // 加载中
const user = ref<MemberUserApi.User>({} as MemberUserApi.User);
async function getUserData() {
  loading.value = true;
  try {
    const res = await getUser(conversation.value.userId);
    if (res) {
      user.value = res;
    } else {
      user.value = {} as MemberUserApi.User;
      message.error('会员不存在！');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Layout
    class="bg-card relative w-72 after:absolute after:left-0 after:top-0 after:h-full after:w-[1px] after:scale-x-[0.3] after:bg-gray-200 after:content-['']"
  >
    <Layout.Header
      class="!bg-card relative flex items-center justify-around before:absolute before:bottom-0 before:left-0 before:h-[1px] before:w-full before:scale-y-[0.3] before:bg-gray-200 before:content-['']"
    >
      <div
        :class="{
          'before:border-b-2 before:border-gray-500/50':
            tabActivation('会员信息'),
        }"
        class="relative flex h-full w-full cursor-pointer items-center justify-center before:pointer-events-none before:absolute before:inset-0 before:content-[''] hover:before:border-b-2 hover:before:border-gray-500/50"
        @click="handleClick('会员信息')"
      >
        会员信息
      </div>
      <div
        :class="{
          'before:border-b-2 before:border-gray-500/50':
            tabActivation('最近浏览'),
        }"
        class="relative flex h-full w-full cursor-pointer items-center justify-center before:pointer-events-none before:absolute before:inset-0 before:content-[''] hover:before:border-b-2 hover:before:border-gray-500/50"
        @click="handleClick('最近浏览')"
      >
        最近浏览
      </div>
      <div
        :class="{
          'before:border-b-2 before:border-gray-500/50':
            tabActivation('交易订单'),
        }"
        class="relative flex h-full w-full cursor-pointer items-center justify-center before:pointer-events-none before:absolute before:inset-0 before:content-[''] hover:before:border-b-2 hover:before:border-gray-500/50"
        @click="handleClick('交易订单')"
      >
        交易订单
      </div>
    </Layout.Header>
    <Layout.Content class="relative m-0 h-full w-full p-2">
      <template v-if="!isEmpty(conversation)">
        <div
          v-loading="loading"
          v-if="activeTab === '会员信息'"
          class="relative h-full overflow-y-auto overflow-x-hidden"
        >
          <!-- 基本信息 -->
          <BasicInfo :user="user" mode="kefu">
            <template #title>
              <span class="text-sm font-bold">基本信息</span>
            </template>
          </BasicInfo>
          <!-- 账户信息 -->
          <Card
            class="mt-2 h-full"
            :body-style="{ padding: '16px' }"
            shadow="never"
          >
            <template #title>
              <span class="text-sm font-bold">账户信息</span>
            </template>
            <AccountInfo
              :column="1"
              :user="user"
              :wallet="wallet"
              mode="kefu"
            />
          </Card>
        </div>
        <div
          v-show="activeTab !== '会员信息'"
          ref="scrollbarRef"
          v-scroll="handleScroll"
          class="relative h-full overflow-y-auto overflow-x-hidden"
        >
          <!-- 最近浏览 -->
          <ProductBrowsingHistory
            v-if="activeTab === '最近浏览'"
            ref="productBrowsingHistoryRef"
          />
          <!-- 交易订单 -->
          <OrderBrowsingHistory
            v-if="activeTab === '交易订单'"
            ref="orderBrowsingHistoryRef"
          />
        </div>
      </template>
      <Empty v-else description="请选择左侧的一个会话后开始" class="mt-[20%]" />
    </Layout.Content>
  </Layout>
</template>
