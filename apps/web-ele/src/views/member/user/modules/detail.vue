<script setup lang="ts">
import type { MemberUserApi } from '#/api/member/user';
import type { PayWalletApi } from '#/api/pay/wallet/balance';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { ElButton, ElCard, ElMessage, ElTabPane, ElTabs } from 'element-plus';

import { getUser } from '#/api/member/user';
import { getWallet } from '#/api/pay/wallet/balance';
import { $t } from '#/locales';

import UserAccountInfo from '../components/user-account-info.vue';
import UserAddressList from '../components/user-address-list.vue';
import UserAfterSaleList from '../components/user-after-sale-list.vue';
import UserBalanceList from '../components/user-balance-list.vue';
import UserBasicInfo from '../components/user-basic-info.vue';
import UserBrokerageList from '../components/user-brokerage-list.vue';
import UserCouponList from '../components/user-coupon-list.vue';
import UserExperienceRecordList from '../components/user-experience-record-list.vue';
import UserFavoriteList from '../components/user-favorite-list.vue';
import UserOrderList from '../components/user-order-list.vue';
import UserPointList from '../components/user-point-list.vue';
import UserSignList from '../components/user-sign-list.vue';
import Form from './form.vue';

const route = useRoute();
const { closeCurrentTab, refreshTab } = useTabs();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const userId = Number(route.query.id);
const user = ref<MemberUserApi.User>();
const wallet = ref<PayWalletApi.Wallet>();
const activeName = ref('UserPointList');
/* 钱包初始化数据 */
const WALLET_INIT_DATA = {
  balance: 0,
  totalExpense: 0,
  totalRecharge: 0,
} as PayWalletApi.Wallet;

async function getUserDetail() {
  if (!userId) {
    ElMessage.error('参数错误，会员编号不能为空！');
    closeCurrentTab();
    return;
  }
  user.value = await getUser(userId);
  wallet.value = (await getWallet({ userId })) || WALLET_INIT_DATA;
}

function handleEdit() {
  formModalApi.setData(user.value).open();
}

onMounted(async () => {
  await getUserDetail();
});
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="refreshTab" />
    <div class="flex">
      <UserBasicInfo v-if="user" class="w-3/5" :user="user" mode="member">
        <template #title> 基本信息 </template>
        <template #extra>
          <ElButton type="primary" @click="handleEdit">
            {{ $t('common.edit') }}
          </ElButton>
        </template>
      </UserBasicInfo>
      <UserAccountInfo
        v-if="user && wallet"
        class="ml-4 w-2/5"
        :user="user"
        :wallet="wallet"
      >
        <template #title> 账户信息 </template>
      </UserAccountInfo>
    </div>
    <div class="mt-4">
      <ElCard title="账户明细">
        <ElTabs v-model="activeName">
          <ElTabPane label="积分" name="UserPointList">
            <UserPointList class="h-full" :user-id="userId" />
          </ElTabPane>
          <ElTabPane label="签到" name="UserSignList">
            <UserSignList class="h-full" :user-id="userId" />
          </ElTabPane>
          <ElTabPane label="成长值" name="UserExperienceRecordList">
            <UserExperienceRecordList class="h-full" :user-id="userId" />
          </ElTabPane>
          <ElTabPane label="余额" name="UserBalanceList">
            <UserBalanceList class="h-full" :wallet-id="wallet?.id" />
          </ElTabPane>
          <ElTabPane label="收货地址" name="UserAddressList">
            <UserAddressList class="h-full" :user-id="userId" />
          </ElTabPane>
          <ElTabPane label="订单管理" name="UserOrderList">
            <!-- Todo: 商城模块 -->
            <div class="h-full">
              <UserOrderList class="h-full" :user-id="userId" />
            </div>
          </ElTabPane>
          <ElTabPane label="售后管理" name="UserAfterSaleList">
            <!-- Todo: 商城模块 -->
            <div class="h-full">
              <UserAfterSaleList class="h-full" :user-id="userId" />
            </div>
          </ElTabPane>
          <ElTabPane label="收藏记录" name="UserFavoriteList">
            <!-- Todo: 商城模块 -->
            <div class="h-full">
              <UserFavoriteList class="h-full" :user-id="userId" />
            </div>
          </ElTabPane>
          <ElTabPane label="优惠劵" name="UserCouponList">
            <!-- Todo: 商城模块 -->
            <div class="h-full">
              <UserCouponList class="h-full" :user-id="userId" />
            </div>
          </ElTabPane>
          <ElTabPane label="推广用户" name="UserBrokerageList">
            <!-- Todo: 商城模块 -->
            <div class="h-full">
              <UserBrokerageList class="h-full" :user-id="userId" />
            </div>
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>
  </Page>
</template>
