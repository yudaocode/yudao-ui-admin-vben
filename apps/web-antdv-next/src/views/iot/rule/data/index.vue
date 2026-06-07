<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Tabs } from 'antdv-next';

import DataRuleList from './rule/index.vue';
import DataSinkList from './sink/index.vue';

const activeTabName = ref('rule');
const ruleDataTabItems = [
  { key: 'rule', label: '规则' },
  { key: 'sink', label: '目的' },
];
</script>

<template>
  <Page auto-content-height>
    <Tabs v-model:active-key="activeTabName" :items="ruleDataTabItems">
      <template #contentRender="{ item }">
        <DataRuleList v-if="item.key === 'rule'" />
        <DataSinkList v-else-if="item.key === 'sink'" />
      </template>
    </Tabs>
  </Page>
</template>
