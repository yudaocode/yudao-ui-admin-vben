<!-- 右侧信息：会员信息 + 最近浏览 + 交易订单 -->
<script lang="ts" setup>
import type { MallKefuConversationApi } from '#/api/mall/promotion/kefu/conversation';

import { computed, nextTick, ref } from 'vue';

import { isEmpty } from '@vben/utils';

// TODO @jawe：debounce 是不是还是需要的哈；应该有 2 处需要；可以微信沟通哈；
// import { debounce } from 'lodash-es'
import { useDebounceFn } from '@vueuse/core';
import { Card, Empty, message } from 'ant-design-vue';

import * as UserApi from '#/api/member/user';
import * as WalletApi from '#/api/pay/wallet/balance';
import { CardTitle } from '#/components/card-title';
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
const scrollbarRef = ref<InstanceType>();
const handleScroll = useDebounceFn(() => {
  const wrap = scrollbarRef.value?.wrapRef;
  // 触底重置
  if (Math.abs(wrap!.scrollHeight - wrap!.clientHeight - wrap!.scrollTop) < 1) {
    loadMore();
  }
}, 200);

/** 查询用户钱包信息 */
// TODO @jawe：idea 的导入报错；需要看下；
const WALLET_INIT_DATA = {
  balance: 0,
  totalExpense: 0,
  totalRecharge: 0,
} as WalletApi.WalletVO; // 钱包初始化数据
const wallet = ref<WalletApi.WalletVO>(WALLET_INIT_DATA); // 钱包信息

async function getUserWallet() {
  if (!conversation.value.userId) {
    wallet.value = WALLET_INIT_DATA;
    return;
  }
  wallet.value =
    (await WalletApi.getWallet({ userId: conversation.value.userId })) ||
    WALLET_INIT_DATA;
}

/** 获得用户 */
const loading = ref(true); // 加载中
const user = ref<UserApi.UserVO>({} as UserApi.UserVO);
async function getUserData() {
  loading.value = true;
  try {
    const res = await UserApi.getUser(conversation.value.userId);
    if (res) {
      user.value = res;
    } else {
      user.value = {} as UserApi.UserVO;
      message.error('会员不存在！');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <!-- TODO @jave：from xingyu：a- 换成大写的方式，另外组件没有进行导入，其他页面也有这个问题 -->
  <a-layout class="kefu">
    <a-layout-header class="kefu-header">
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
    </a-layout-header>
    <a-layout-content class="kefu-content p-10px!">
      <div v-if="!isEmpty(conversation)" v-loading="loading">
        <!-- 基本信息 -->
        <BasicInfo v-if="activeTab === '会员信息'" :user="user" mode="kefu">
          <template #header>
            <CardTitle title="基本信息" />
          </template>
        </BasicInfo>
        <!-- 账户信息 -->
        <Card
          v-if="activeTab === '会员信息'"
          class="mt-10px h-full"
          shadow="never"
        >
          <template #header>
            <CardTitle title="账户信息" />
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
    </a-layout-content>
  </a-layout>
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
