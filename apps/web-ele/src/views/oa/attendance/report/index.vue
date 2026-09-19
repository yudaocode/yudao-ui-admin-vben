<script lang="ts" setup>
import { ref } from 'vue';

import { ContentWrap, DocAlert, Page } from '@vben/common-ui';

import { ElTabPane, ElTabs } from 'element-plus';

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
      <ElTabs v-model="activeTab">
        <ElTabPane label="周报" name="week">
          <WeekReport />
        </ElTabPane>
        <ElTabPane label="月报" name="month" lazy>
          <MonthReport />
        </ElTabPane>
      </ElTabs>
    </ContentWrap>
  </Page>
</template>
