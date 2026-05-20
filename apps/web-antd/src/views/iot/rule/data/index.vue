<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Tabs } from 'ant-design-vue';

import DataRuleList from './rule/index.vue';
import DataSinkList from './sink/index.vue';

// TODO DONE @AI：下面的"/** IoT 数据流转：规则 / 目的 */"需要注释么？基线无文件级注释，已删除
const activeTabName = ref('rule');
</script>

<template>
  <Page auto-content-height>
    <Tabs v-model:active-key="activeTabName">
      <Tabs.TabPane key="rule" tab="规则">
        <DataRuleList />
      </Tabs.TabPane>
      <Tabs.TabPane key="sink" tab="目的">
        <DataSinkList />
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
