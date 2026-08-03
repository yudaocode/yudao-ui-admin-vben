<script lang="ts" setup>
import type { HrmHomeApi } from '#/api/hrm/home';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Col, Row, Spin } from 'antdv-next';

import {
  getTeamHomeCalendar,
  getTeamHomeStatisticsSummary,
} from '#/api/hrm/home';
import { HrmHomeCalendarItemType } from '#/views/hrm/utils/constants';

import HrmHomeCalendar from '../components/calendar.vue';
import HrmTeamOverview from './components/team-overview.vue';
import HrmTeamSurvey from './components/team-survey.vue';

defineOptions({ name: 'HrmTeamHome' });

const router = useRouter();
const loading = ref(false);
const summary = ref<HrmHomeApi.TeamHomeStatisticsResp>();
const calendarRef = ref<InstanceType<typeof HrmHomeCalendar>>();

/** 获得团队工作台统计 */
async function getSummary() {
  loading.value = true;
  try {
    summary.value = await getTeamHomeStatisticsSummary();
  } finally {
    loading.value = false;
  }
}

/** 团队日历中的员工事项支持跳转详情 */
function isCalendarItemClickable(item: HrmHomeApi.HomeCalendarItem) {
  return item.type !== HrmHomeCalendarItemType.NOTE && !!item.typeId;
}

/** 打开下属员工档案 */
function openCalendarItem(item: HrmHomeApi.HomeCalendarItem) {
  if (item.typeId) {
    router.push({ name: 'HrmEmployeeDetail', params: { id: item.typeId } });
  }
}

/** 初始化 */
onMounted(() => {
  getSummary();
  calendarRef.value?.refresh();
});
</script>

<template>
  <Page>
    <Spin :spinning="loading">
      <div class="mb-4 text-2xl leading-7">团队工作台</div>
      <Row :gutter="[16, 16]" align="top">
        <Col :lg="16" :md="24">
          <div class="flex flex-col gap-4">
            <HrmTeamOverview
              :leader-employee-id="summary?.leaderEmployeeId"
              :overview="summary?.teamOverview"
            />
            <HrmTeamSurvey :survey="summary?.teamSurvey" />
          </div>
        </Col>
        <Col :lg="8" :md="24">
          <div class="flex flex-col gap-4">
            <HrmHomeCalendar
              ref="calendarRef"
              :get-calendar-items="getTeamHomeCalendar"
              :is-item-clickable="isCalendarItemClickable"
              @item-click="openCalendarItem"
            />
          </div>
        </Col>
      </Row>
    </Spin>
  </Page>
</template>
