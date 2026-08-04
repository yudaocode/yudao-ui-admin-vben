<script lang="ts" setup>
import type { HrmHomeApi } from '#/api/hrm/home';
import type { HrmPortalEmployeeApi } from '#/api/hrm/portal/employee';
import type { HrmPortalSalarySlipApi } from '#/api/hrm/portal/salary/slip';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Col, Row, Spin } from 'antdv-next';

import { getEmployee } from '#/api/hrm/portal/employee';
import { getEmployeeHomeCalendar } from '#/api/hrm/portal/home/calendar';
import { getUnreadSalarySlipSummary } from '#/api/hrm/portal/salary/slip';
import HrmHomeCalendar from '#/views/hrm/home/components/calendar.vue';
import { HrmHomeCalendarItemType } from '#/views/hrm/utils/constants';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';

import EmployeeSurvey from './components/employee-survey.vue';

defineOptions({ name: 'HrmPortalHome' });

const router = useRouter();
const accessible = ref(false);
const loading = ref(false);
const employee = ref<HrmPortalEmployeeApi.PortalEmployee>();
const salarySlipSummary = ref<HrmPortalSalarySlipApi.UnreadSummary>();
const calendarRef = ref<InstanceType<typeof HrmHomeCalendar>>();

/** 员工端仅为个人备忘展示具体时间 */
function isCalendarItemTimeVisible(item: HrmHomeApi.HomeCalendarItem) {
  return item.type === HrmHomeCalendarItemType.NOTE;
}

/** 刷新员工工作台 */
async function refreshAll() {
  loading.value = true;
  try {
    const [employeeData, salarySummary] = await Promise.all([
      getEmployee(),
      getUnreadSalarySlipSummary(),
      calendarRef.value?.refresh(),
    ]);
    employee.value = employeeData;
    salarySlipSummary.value = salarySummary;
  } finally {
    loading.value = false;
  }
}

/** 页面激活时刷新个人工作台 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  if (!accessible.value) {
    return;
  }
  await refreshAll();
});
</script>

<template>
  <Page v-if="accessible">
    <Spin :spinning="loading">
      <Row :gutter="[16, 16]" align="top">
        <Col :span="16">
          <EmployeeSurvey
            :employee="employee"
            :salary-slip-summary="salarySlipSummary"
          />
        </Col>
        <Col :span="8">
          <HrmHomeCalendar
            ref="calendarRef"
            :get-calendar-items="getEmployeeHomeCalendar"
            :show-item-time="isCalendarItemTimeVisible"
          />
        </Col>
      </Row>
    </Spin>
  </Page>
</template>
