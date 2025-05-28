<script setup lang="ts">
import type { MemberUserApi } from '#/api/member/user';
import type { PayWalletApi } from '#/api/pay/wallet/balance';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, Card, message, TabPane, Tabs } from 'ant-design-vue';

import { getUser } from '#/api/member/user';
import { getWallet } from '#/api/pay/wallet/balance';
import { $t } from '#/locales';

import UserAccountInfo from '../components/user-account-info.vue';
import UserBasicInfo from '../components/user-basic-info.vue';
import UserExperienceRecordList from '../components/user-experience-record-list.vue';
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
const wallet = ref<PayWalletApi.WalletVO>();
/* 钱包初始化数据 */
const WALLET_INIT_DATA = {
  balance: 0,
  totalExpense: 0,
  totalRecharge: 0,
} as PayWalletApi.WalletVO;

async function getUserDetail() {
  if (!userId) {
    message.error('参数错误，会员编号不能为空！');
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
          <Button type="primary" @click="handleEdit">
            {{ $t('common.edit') }}
          </Button>
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
      <Card title="账户明细">
        <Tabs>
          <TabPane tab="积分" key="UserPointList">
            <UserPointList class="h-full" :user-id="userId" />
          </TabPane>
          <TabPane tab="签到" key="UserSignList">
            <UserSignList class="h-full" :user-id="userId" />
          </TabPane>
          <TabPane tab="成长值" key="UserExperienceRecordList">
            <UserExperienceRecordList class="h-full" :user-id="userId" />
          </TabPane>
          <TabPane tab="余额" key="UserBalanceList" />
          <TabPane tab="收货地址" key="UserAddressList" />
          <TabPane tab="订单管理" key="UserOrderList" />
          <TabPane tab="售后管理" key="UserAfterSaleList" />
          <TabPane tab="收藏记录" key="UserFavoriteList" />
          <TabPane tab="优惠劵" key="UserCouponList" />
          <TabPane tab="推广用户" key="UserBrokerageList" />
        </Tabs>
      </Card>
    </div>
  </Page>
</template>
