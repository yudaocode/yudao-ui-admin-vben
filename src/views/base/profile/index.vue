<script lang="ts" setup>
import { TabPane, Tabs } from 'ant-design-vue'
import { ref } from 'vue'
import { settingList } from './data'
import BaseSetting from './BaseSetting.vue'
import SecureSetting from './SecureSetting.vue'
import AccountBind from './AccountBind.vue'
import MsgNotify from './MsgNotify.vue'
import { ScrollContainer } from '@/components/Container/index'

const wrapperRef = ref(null)

const tabBarStyle = { width: '220px' }
</script>

<template>
  <ScrollContainer>
    <div ref="wrapperRef" class="m-3 rounded-1.5 bg-[var(--component-background)]">
      <Tabs tab-position="left" :tab-bar-style="tabBarStyle">
        <template v-for="item in settingList" :key="item.key">
          <TabPane :tab="item.name">
            <BaseSetting v-if="item.component === 'BaseSetting'" />
            <SecureSetting v-if="item.component === 'SecureSetting'" />
            <AccountBind v-if="item.component === 'AccountBind'" />
            <MsgNotify v-if="item.component === 'MsgNotify'" />
          </TabPane>
        </template>
      </Tabs>
    </div>
  </ScrollContainer>
</template>
