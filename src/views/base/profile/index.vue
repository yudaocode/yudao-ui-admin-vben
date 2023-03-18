<template>
  <ScrollContainer>
    <div ref="wrapperRef" class="account-setting">
      <Tabs tab-position="left" :tabBarStyle="tabBarStyle">
        <template v-for="item in settingList" :key="item.key">
          <TabPane :tab="item.name">
            <BaseSetting v-if="item.component == 'BaseSetting'" />
            <SecureSetting v-if="item.component == 'SecureSetting'" />
            <AccountBind v-if="item.component == 'AccountBind'" />
            <MsgNotify v-if="item.component == 'MsgNotify'" />
          </TabPane>
        </template>
      </Tabs>
    </div>
  </ScrollContainer>
</template>
<script setup lang="ts">
import { Tabs, TabPane } from 'ant-design-vue'
import { ScrollContainer } from '@/components/Container/index'
import { settingList } from './data'
import BaseSetting from './BaseSetting.vue'
import SecureSetting from './SecureSetting.vue'
import AccountBind from './AccountBind.vue'
import MsgNotify from './MsgNotify.vue'
const tabBarStyle = { width: '220px' }
</script>
<style lang="less">
.account-setting {
  margin: 12px;
  background-color: @component-background;

  .base-title {
    padding-left: 0;
  }

  .ant-tabs-tab-active {
    background-color: @item-active-bg;
  }
}
</style>
