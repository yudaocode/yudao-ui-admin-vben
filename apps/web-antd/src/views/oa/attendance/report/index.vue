<script lang="ts" setup>
import { ref } from 'vue';

import { ContentWrap, DocAlert, Page } from '@vben/common-ui';

import { Tabs } from 'ant-design-vue';

import MonthReport from './modules/month-report.vue';
import WeekReport from './modules/week-report.vue';

defineOptions({ name: 'OaAttendanceReport' });

const activeTab = ref('week'); // 当前报表类型
</script>

<template>
  <Page>
    <DocAlert title="【流程】考勤、请假、加班、转正与离职" url="https://doc.iocoder.cn/oa/attendance-application/" />
    <!-- 考勤报表 -->
    <ContentWrap>
      <Tabs v-model:active-key="activeTab">
        <Tabs.TabPane key="week" tab="周报">
          <WeekReport />
        </Tabs.TabPane>
        <Tabs.TabPane key="month" tab="月报">
          <MonthReport />
        </Tabs.TabPane>
      </Tabs>
    </ContentWrap>
  </Page>
</template>
