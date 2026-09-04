<script lang="ts" setup>
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { computed } from 'vue';

import { formatDate } from '@vben/utils';

import { Calendar, Spin, Tag } from 'antdv-next';
import dayjs from 'dayjs';

defineOptions({ name: 'HrmPortalAttendanceCalendar' });

const props = defineProps<{
  calendarDate: Date;
  dailyDetails?: HrmAttendanceStatisticsApi.DailyDetail[];
  loading: boolean;
  selectedMonth: Date;
}>();

const dailyDetailMap = computed(
  () =>
    new Map(
      (props.dailyDetails || []).map((detail) => [
        formatDate(detail.attendanceTime, 'YYYY-MM-DD'),
        detail,
      ]),
    ),
);

/** 获取每日考勤详情 */
function getDailyDetail(date: string) {
  return dailyDetailMap.value.get(date);
}

/** 是否为异常考勤 */
function isAbnormal(detail?: HrmAttendanceStatisticsApi.DailyDetail) {
  if (!detail) {
    return false;
  }
  return (
    (detail.lateCount || 0) > 0 ||
    (detail.earlyCount || 0) > 0 ||
    (detail.misscardCount || 0) > 0 ||
    detail.absenteeism === true
  );
}

/** 获取日期状态样式 */
function getDayStatusClass(detail?: HrmAttendanceStatisticsApi.DailyDetail) {
  if (!detail) {
    return '';
  }
  if (isAbnormal(detail)) {
    return 'is-abnormal';
  }
  if (detail.scheduled === false) {
    return 'is-rest';
  }
  return detail.clockList?.length ? 'is-normal' : '';
}

/** 获取日期标签颜色 */
function getDayTagColor(detail?: HrmAttendanceStatisticsApi.DailyDetail) {
  if (isAbnormal(detail)) {
    return 'error';
  }
  if (detail?.scheduled === false) {
    return 'default';
  }
  return 'success';
}

/** 获取打卡状态名称 */
function getClockStatusName(status?: number) {
  return ['正常', '迟到', '早退', '缺卡'][status ?? 0] || '未知';
}

/** 获取每日考勤标记 */
function getDailyBadges(detail?: HrmAttendanceStatisticsApi.DailyDetail) {
  if (!detail) {
    return [];
  }
  const badges: string[] = [];
  if (Number(detail.leaveDays || 0) > 0) {
    badges.push(`请假${detail.leaveDays}天`);
  }
  return badges;
}

/** 是否当前月 */
function isCurrentMonth(date: string) {
  return dayjs(date).isSame(dayjs(props.selectedMonth), 'month');
}
</script>

<template>
  <Spin :spinning="loading">
    <Calendar
      :value="dayjs(calendarDate)"
      class="attendance-calendar border"
      :fullscreen="false"
    >
      <template #headerRender>
        <div
          class="flex w-full items-center justify-between px-2 py-2 text-base font-semibold"
        >
          <span>{{ formatDate(selectedMonth, 'YYYY年MM月') }}考勤明细</span>
          <div class="flex gap-4 text-xs font-normal text-gray-500">
            <span class="flex items-center gap-1">
              <i class="inline-block h-2 w-2 rounded-full bg-green-500"></i>
              正常
            </span>
            <span class="flex items-center gap-1">
              <i class="inline-block h-2 w-2 rounded-full bg-red-500"></i>
              异常
            </span>
            <span class="flex items-center gap-1">
              <i class="inline-block h-2 w-2 rounded-full bg-gray-400"></i>
              休息
            </span>
          </div>
        </div>
      </template>
      <template #fullCellRender="{ date }">
        <div
          class="calendar-cell"
          :class="[
            !isCurrentMonth(date.format('YYYY-MM-DD')) && 'is-other-month',
            getDayStatusClass(getDailyDetail(date.format('YYYY-MM-DD'))),
          ]"
        >
          <div class="mb-2 flex items-center justify-between font-semibold">
            <span>{{ date.format('DD') }}</span>
            <Tag
              v-if="
                isCurrentMonth(date.format('YYYY-MM-DD')) &&
                getDailyDetail(date.format('YYYY-MM-DD'))?.attendanceResult
              "
              :color="getDayTagColor(getDailyDetail(date.format('YYYY-MM-DD')))"
            >
              {{ getDailyDetail(date.format('YYYY-MM-DD'))?.attendanceResult }}
            </Tag>
          </div>
          <template v-if="isCurrentMonth(date.format('YYYY-MM-DD'))">
            <div
              v-for="clock in getDailyDetail(date.format('YYYY-MM-DD'))
                ?.clockList || []"
              :key="clock.id || `${clock.type}-${clock.clockTime}`"
              class="mt-1 flex justify-between text-xs text-gray-500"
            >
              <span>{{ clock.type === 2 ? '下班' : '上班' }}</span>
              <strong class="text-gray-800">
                {{ formatDate(clock.clockTime, 'HH:mm') || '--:--' }}
              </strong>
              <em
                class="not-italic text-green-600"
                :class="clock.status ? '!text-red-500' : ''"
              >
                {{ getClockStatusName(clock.status) }}
              </em>
            </div>
            <div
              v-if="
                getDailyBadges(getDailyDetail(date.format('YYYY-MM-DD'))).length
              "
              class="mt-1 flex flex-wrap gap-1"
            >
              <Tag
                v-for="badge in getDailyBadges(
                  getDailyDetail(date.format('YYYY-MM-DD')),
                )"
                :key="badge"
              >
                {{ badge }}
              </Tag>
            </div>
            <div
              v-if="
                getDailyDetail(date.format('YYYY-MM-DD')) &&
                !(getDailyDetail(date.format('YYYY-MM-DD'))?.clockList || [])
                  .length
              "
              class="mt-3 text-center text-xs text-gray-400"
            >
              暂无打卡
            </div>
          </template>
        </div>
      </template>
    </Calendar>
  </Spin>
</template>

<style scoped>
.attendance-calendar :deep(.ant-picker-panel) {
  border-top: none;
}

.attendance-calendar :deep(.ant-picker-content td) {
  padding: 0;
}

.calendar-cell {
  box-sizing: border-box;
  min-height: 132px;
  padding: 9px 10px;
  border-top: 2px solid transparent;
}

.calendar-cell.is-normal {
  border-top-color: #52c41a;
}

.calendar-cell.is-abnormal {
  border-top-color: #ff4d4f;
}

.calendar-cell.is-rest {
  border-top-color: #d9d9d9;
}

.calendar-cell.is-other-month {
  color: #bfbfbf;
  background: #fafafa;
}
</style>
