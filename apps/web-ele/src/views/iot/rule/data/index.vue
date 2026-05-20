<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElTabPane, ElTabs } from 'element-plus';

import DataRuleList from './rule/index.vue';
import DataSinkList from './sink/index.vue';

// TODO DONE @AI：下面的"/** IoT 数据流转：规则 / 目的 */"需要注释么？基线无文件级注释，已删除
const activeTabName = ref('rule');
</script>

<template>
  <Page auto-content-height>
    <ElTabs v-model="activeTabName">
      <ElTabPane name="rule" label="规则">
        <DataRuleList />
      </ElTabPane>
      <ElTabPane name="sink" label="目的">
        <DataSinkList />
      </ElTabPane>
    </ElTabs>
  </Page>
</template>
