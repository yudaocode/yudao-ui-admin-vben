<script lang="ts" setup>
import type { HrmHomeApi } from '#/api/hrm/home';
import type { HrmPortalEmployeeApi } from '#/api/hrm/portal/employee';
import type { HrmPortalSalarySlipApi } from '#/api/hrm/portal/salary/slip';

import { nextTick, onActivated, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';

import { ElCol, ElRow } from 'element-plus';

import { getEmployee } from '#/api/hrm/portal/employee';
import { getEmployeeHomeCalendar } from '#/api/hrm/portal/home/calendar';
import { getUnreadSalarySlipSummary } from '#/api/hrm/portal/salary/slip';
import HrmHomeCalendar from '#/views/hrm/home/components/calendar.vue';
import { HrmHomeCalendarItemType } from '#/views/hrm/utils/constants';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';

import EmployeeSurvey from './modules/employee-survey.vue';

defineOptions({ name: 'HrmPortalHome' });

const router = useRouter();
const accessible = ref(false);
const initialized = ref(false);
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

/** 初始化个人工作台 */
onMounted(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  initialized.value = true;
  if (!accessible.value) {
    return;
  }
  await nextTick();
  await refreshAll();
});

/** 页面激活时刷新个人工作台 */
onActivated(async () => {
  if (!initialized.value) {
    return;
  }
  accessible.value = await checkHrmPortalAccess(router);
  if (!accessible.value) {
    return;
  }
  await nextTick();
  await refreshAll();
});
</script>

<template>
  <Page v-if="accessible">
    <DocAlert
      title="【员工】员工管理"
      url="https://doc.iocoder.cn/hrm/employee/"
    />
    <div v-loading="loading">
      <ElRow :gutter="16" align="top">
        <ElCol :span="16">
          <EmployeeSurvey
            :employee="employee"
            :salary-slip-summary="salarySlipSummary"
          />
        </ElCol>
        <ElCol :span="8">
          <HrmHomeCalendar
            ref="calendarRef"
            :get-calendar-items="getEmployeeHomeCalendar"
            :show-item-time="isCalendarItemTimeVisible"
          />
        </ElCol>
      </ElRow>
    </div>
  </Page>
</template>
