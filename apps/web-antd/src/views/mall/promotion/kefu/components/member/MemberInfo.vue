<!-- 右侧信息：会员信息 + 最近浏览 + 交易订单 -->
<script lang="ts" setup>
import type { MallKefuConversationApi } from '#/api/mall/promotion/kefu/conversation';
import type { MemberUserApi } from '#/api/member/user';
import type { PayWalletApi } from '#/api/pay/wallet/balance';

import { computed, nextTick, ref } from 'vue';

import { isEmpty } from '@vben/utils';

// TODO @jawe：debounce 是不是还是需要的哈；应该有 2 处需要；可以微信沟通哈；
// import { debounce } from 'lodash-es'
import { useDebounceFn } from '@vueuse/core';
import { Card, Empty, Layout, message } from 'ant-design-vue';

import { getUser } from '#/api/member/user';
import { getWallet } from '#/api/pay/wallet/balance';
import AccountInfo from '#/views/member/user/detail/modules/account-info.vue';
import BasicInfo from '#/views/member/user/detail/modules/basic-info.vue';

import OrderBrowsingHistory from './OrderBrowsingHistory.vue';
import ProductBrowsingHistory from './ProductBrowsingHistory.vue';

defineOptions({ name: 'MemberBrowsingHistory' });

const activeTab = ref('会员信息');
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
const handleScroll = useDebounceFn(async () => {
  const wrap = scrollbarRef.value?.wrapRef;
  // 触底重置
  if (Math.abs(wrap!.scrollHeight - wrap!.clientHeight - wrap!.scrollTop) < 1) {
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
  <!-- TODO @jave：from xingyu：a- 换成大写的方式，另外组件没有进行导入，其他页面也有这个问题 -->
  <Layout class="kefu">
    <Layout.Header class="kefu-header">
      <div
        :class="{ 'kefu-header-item-activation': tabActivation('会员信息') }"
        class="kefu-header-item flex cursor-pointer items-center justify-center"
        @click="handleClick('会员信息')"
      >
        会员信息
      </div>
      <div
        :class="{ 'kefu-header-item-activation': tabActivation('最近浏览') }"
        class="kefu-header-item flex cursor-pointer items-center justify-center"
        @click="handleClick('最近浏览')"
      >
        最近浏览
      </div>
      <div
        :class="{ 'kefu-header-item-activation': tabActivation('交易订单') }"
        class="kefu-header-item flex cursor-pointer items-center justify-center"
        @click="handleClick('交易订单')"
      >
        交易订单
      </div>
    </Layout.Header>
    <Layout.Content class="kefu-content p-10px!">
      <div v-if="!isEmpty(conversation)" v-loading="loading">
        <!-- 基本信息 -->
        <BasicInfo v-if="activeTab === '会员信息'" :user="user" mode="kefu">
          <template #title>
            <span class="text-sm font-bold">基本信息</span>
          </template>
        </BasicInfo>
        <!-- 账户信息 -->
        <Card
          v-if="activeTab === '会员信息'"
          class="mt-10px h-full"
          shadow="never"
        >
          <template #title>
            <span class="text-sm font-bold">账户信息</span>
          </template>
          <AccountInfo :column="1" :user="user" :wallet="wallet" />
        </Card>
      </div>
      <div v-show="!isEmpty(conversation)">
        <div ref="scrollbarRef" always @scroll="handleScroll">
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
      </div>
      <Empty
        v-show="isEmpty(conversation)"
        description="请选择左侧的一个会话后开始"
        class="mt-[50px]"
      />
    </Layout.Content>
  </Layout>
</template>

<style lang="scss" scoped>
/** TODO @jave：看看哪些可以用 tailwind 简化掉 */
.kefu {
  position: relative;
  width: 300px !important;
  background-color: var(--app-content-bg-color);

  &::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px; /* 实际宽度 */
    height: 100%;
    content: '';
    background-color: var(--el-border-color);
    transform: scaleX(0.3); /* 缩小宽度 */
  }

  &-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-around;
    background-color: var(--app-content-bg-color);

    &::before {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 1px; /* 初始宽度 */
      content: '';
      background-color: var(--el-border-color);
      transform: scaleY(0.3); /* 缩小视觉高度 */
    }

    &-title {
      font-size: 18px;
      font-weight: bold;
    }

    &-item {
      position: relative;
      width: 100%;
      height: 100%;

      &-activation::before {
        position: absolute; /* 绝对定位 */
        inset: 0; /* 覆盖整个元素 */
        pointer-events: none; /* 确保点击事件不会被伪元素拦截 */
        content: '';
        border-bottom: 2px solid rgb(128 128 128 / 50%); /* 边框样式 */
      }

      &:hover::before {
        position: absolute; /* 绝对定位 */
        inset: 0; /* 覆盖整个元素 */
        pointer-events: none; /* 确保点击事件不会被伪元素拦截 */
        content: '';
        border-bottom: 2px solid rgb(128 128 128 / 50%); /* 边框样式 */
      }
    }
  }

  &-content {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    overflow: auto;
  }

  &-tabs {
    width: 100%;
    height: 100%;
  }
}

.header-title {
  border-bottom: #e4e0e0 solid 1px;
}
</style>
