<script lang="ts" setup>
import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { ElTabPane, ElTabs } from 'element-plus';

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
    <ElTabs
      v-model="activeTab"
      class="flex min-h-0 flex-1 flex-col overflow-hidden [&_.el-tabs__content]:min-h-0 [&_.el-tabs__content]:flex-1 [&_.el-tabs__header]:shrink-0 [&_.el-tab-pane]:h-full"
    >
      <ElTabPane class="h-full overflow-auto" label="打卡概况" name="overview">
        <Overview v-if="activeTab === 'overview'" />
      </ElTabPane>
      <ElTabPane class="h-full" label="打卡明细" name="record">
        <RecordList v-if="activeTab === 'record'" class="h-full" />
      </ElTabPane>
    </ElTabs>
  </Page>
</template>
