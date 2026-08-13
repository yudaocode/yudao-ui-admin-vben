<script lang="ts" setup>
import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'antdv-next';

import Overview from './modules/overview.vue';
import RecordList from './modules/record-list.vue';

defineOptions({ name: 'HrmAttendanceClock' });

const activeTab = ref('overview');
</script>

<template>
  <Page auto-content-height content-class="flex flex-col overflow-hidden">
    <template #doc>
      <DocAlert
        title="【考勤】考勤管理"
        url="https://doc.iocoder.cn/hrm/attendance/"
      />
    </template>
    <Tabs
      v-model:active-key="activeTab"
      class="flex min-h-0 flex-1 flex-col overflow-hidden [&_.ant-tabs-content]:min-h-0 [&_.ant-tabs-content]:flex-1 [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-tabpane]:h-full"
    >
      <TabPane key="overview" tab="打卡概况" class="h-full overflow-auto">
        <Overview v-if="activeTab === 'overview'" />
      </TabPane>
      <TabPane key="record" tab="打卡明细" class="h-full">
        <RecordList v-if="activeTab === 'record'" class="h-full" />
      </TabPane>
    </Tabs>
  </Page>
</template>
