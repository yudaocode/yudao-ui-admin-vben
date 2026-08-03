<script lang="ts" setup>
import type { HrmHomeApi } from '#/api/hrm/home';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Col, Row, Spin } from 'antdv-next';

import { getHrHomeCalendar, getHrHomeStatisticsSummary } from '#/api/hrm/home';
import { HrmHomeCalendarItemType } from '#/views/hrm/utils/constants';

import HrmHomeCalendar from '../components/calendar.vue';
import HrmHomeEmployeeSurvey from '../components/employee-survey.vue';
import HrmHomeRecruitSurvey from '../components/recruit-survey.vue';
import HrmHomeSalarySurvey from '../components/salary-survey.vue';
import HrmHomeTodoSurvey from '../components/todo-survey.vue';

defineOptions({ name: 'HrmHrHome' });

const router = useRouter();
const loading = ref(false);
const summary = ref<HrmHomeApi.HrHomeStatisticsResp>();
const calendarRef = ref<InstanceType<typeof HrmHomeCalendar>>();

/** 获得首页统计汇总 */
async function getSummary() {
  loading.value = true;
  try {
    summary.value = await getHrHomeStatisticsSummary();
  } finally {
    loading.value = false;
  }
}

/** 日历事项是否支持跳转详情 */
function isCalendarItemClickable(item: HrmHomeApi.HomeCalendarItem) {
  return item.type !== HrmHomeCalendarItemType.NOTE && !!item.typeId;
}

/** 打开日历事项详情 */
function openCalendarItem(item: HrmHomeApi.HomeCalendarItem) {
  if (!item.typeId) {
    return;
  }
  if (item.type === HrmHomeCalendarItemType.RECRUIT) {
    router.push({
      name: 'HrmRecruitCandidateDetail',
      params: { id: item.typeId },
    });
    return;
  }
  router.push({ name: 'HrmEmployeeDetail', params: { id: item.typeId } });
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
      <div class="mb-4 text-2xl leading-7">HR 工作台</div>
      <Row :gutter="[16, 16]" align="top">
        <Col :span="16">
          <div class="flex flex-col gap-4">
            <HrmHomeEmployeeSurvey :survey="summary?.employeeSurvey" />
            <HrmHomeRecruitSurvey :survey="summary?.recruitSurvey" />
            <HrmHomeSalarySurvey :survey="summary?.salarySurvey" />
          </div>
        </Col>
        <Col :span="8">
          <div class="flex flex-col gap-4">
            <HrmHomeTodoSurvey :survey="summary?.todoSurvey" />
            <HrmHomeCalendar
              ref="calendarRef"
              :get-calendar-items="getHrHomeCalendar"
              :is-item-clickable="isCalendarItemClickable"
              @item-click="openCalendarItem"
            />
          </div>
        </Col>
      </Row>
    </Spin>
  </Page>
</template>
