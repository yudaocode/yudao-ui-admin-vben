<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElTabPane, ElTabs } from 'element-plus';

import DataRuleList from './rule/index.vue';
import DataSinkList from './sink/index.vue';

const activeTabName = ref('rule');
</script>

<template>
  <Page auto-content-height>
    <ElTabs v-model="activeTabName">
      <ElTabPane name="rule" label="规则">
        <DataRuleList />
      </ElTabPane>
      <ElTabPane name="sink" label="目的" lazy>
        <DataSinkList />
      </ElTabPane>
    </ElTabs>
  </Page>
</template>
