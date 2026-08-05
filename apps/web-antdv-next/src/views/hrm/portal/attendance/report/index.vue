<script lang="ts" setup>
import type { AttendanceMonthDetail } from '#/api/hrm/portal/attendance/statistics';

import { computed, onActivated, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { Button, Card, DatePicker, Spin } from 'antdv-next';
import dayjs from 'dayjs';

import {
  exportAttendanceMonthDetail,
  getAttendanceMonthDetail,
} from '#/api/hrm/portal/attendance/statistics';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';
import { formatHrmDays } from '#/views/hrm/utils/format';

import AttendanceCalendar from './AttendanceCalendar.vue';
import AttendanceLeaveList from './AttendanceLeaveList.vue';

defineOptions({ name: 'HrmPortalAttendanceReport' });

const router = useRouter();
const route = useRoute();
const { hasAccessByCodes } = useAccess();

const accessible = ref(false);
const loading = ref(false);
const exportLoading = ref(false);
const selectedMonth = ref(
  dayjs(String(route.query.month || '')).isValid()
    ? dayjs(String(route.query.month)).startOf('month')
    : dayjs().startOf('month'),
);
const calendarDate = ref(selectedMonth.value.toDate());
const monthDetail = ref<AttendanceMonthDetail>();
const leaveListRef = ref<InstanceType<typeof AttendanceLeaveList>>();

const attendanceCycle = computed(() => {
  const month = selectedMonth.value;
  return `${formatDate(month.toDate(), 'MM')}月01日~${formatDate(month.toDate(), 'MM')}月${formatDate(
    month.endOf('month').toDate(),
    'DD',
  )}日`;
});

const summaryItems = computed(() => [
  {
    label: '应出勤天数',
    value: monthDetail.value?.summary?.attendDays ?? 0,
    unit: '天',
  },
  {
    label: '实际出勤天数',
    value: formatHrmDays(monthDetail.value?.summary?.actualDays),
    unit: '天',
  },
  {
    label: '迟到',
    value: monthDetail.value?.summary?.lateCount ?? 0,
    unit: '次',
  },
  {
    label: '早退',
    value: monthDetail.value?.summary?.earlyCount ?? 0,
    unit: '次',
  },
  {
    label: '缺卡',
    value: monthDetail.value?.summary?.misscardCount ?? 0,
    unit: '次',
  },
]);

/** 禁用未来日期 */
function disabledFutureDate(current: dayjs.Dayjs) {
  return current.startOf('month').isAfter(dayjs().startOf('month'));
}

/** 获得月度考勤详情 */
async function loadData() {
  loading.value = true;
  try {
    monthDetail.value = await getAttendanceMonthDetail(
      selectedMonth.value.year(),
      selectedMonth.value.month() + 1,
    );
  } finally {
    loading.value = false;
  }
}

/** 月份切换操作 */
function handleMonthChange(value: dayjs.Dayjs | dayjs.Dayjs[] | null) {
  if (!value || Array.isArray(value)) {
    return;
  }
  const month = dayjs(value).startOf('month');
  selectedMonth.value = month;
  calendarDate.value = month.toDate();
  loadData();
}

/** 打开请假表单 */
function openLeaveForm() {
  leaveListRef.value?.openCreate();
}

/** 导出操作 */
async function handleExport() {
  const month = selectedMonth.value;
  try {
    exportLoading.value = true;
    const data = await exportAttendanceMonthDetail(
      month.year(),
      month.month() + 1,
    );
    downloadFileFromBlobPart({
      fileName: `${formatDate(month.toDate(), 'YYYY年MM月')}个人考勤日报.xls`,
      source: data,
    });
  } finally {
    exportLoading.value = false;
  }
}

/** 页面激活时刷新考勤报告 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  if (!accessible.value) {
    return;
  }
  await Promise.all([loadData(), leaveListRef.value?.refresh()]);
});
</script>

<template>
  <Page v-if="accessible">
    <Card title="考勤报表">
      <Spin :spinning="loading">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <DatePicker
            v-model:value="selectedMonth"
            :allow-clear="false"
            :disabled-date="disabledFutureDate"
            format="YYYY年MM月"
            picker="month"
            @change="handleMonthChange"
          />
          <span class="text-sm text-gray-500">
            考勤周期（{{ attendanceCycle }}）
          </span>
          <Button
            v-if="hasAccessByCodes(['hrm:portal:attendance:leave'])"
            type="primary"
            @click="openLeaveForm"
          >
            请假申请
          </Button>
          <Button :loading="exportLoading" type="default" @click="handleExport">
            导出考勤
          </Button>
        </div>

        <div class="mb-4 grid grid-cols-5 rounded border">
          <div
            v-for="(item, index) in summaryItems"
            :key="item.label"
            class="min-h-20 px-4 py-3"
            :class="index < summaryItems.length - 1 ? 'border-r' : ''"
          >
            <span class="mb-1 block text-xs text-gray-500">{{
              item.label
            }}</span>
            <strong class="text-2xl font-medium">{{ item.value }}</strong>
            <small class="ml-1 text-gray-500">{{ item.unit }}</small>
          </div>
        </div>

        <AttendanceCalendar
          :calendar-date="calendarDate"
          :daily-details="monthDetail?.dailyDetails"
          :loading="loading"
          :selected-month="selectedMonth.toDate()"
        />
        <AttendanceLeaveList ref="leaveListRef" @changed="loadData" />
      </Spin>
    </Card>
  </Page>
</template>
