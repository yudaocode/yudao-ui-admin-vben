<script lang="ts" setup>
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate } from '@vben/utils';

import dayjs from 'dayjs';
import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getAttendanceMonthDetail } from '#/api/hrm/attendance/statistics';
import { DictTag } from '#/components/dict-tag';
import { HRM_WEEK_OPTIONS } from '#/views/hrm/utils/constants';
import {
  formatHrmDateTime,
  formatHrmDays,
  formatHrmMoney,
} from '#/views/hrm/utils/format';

import {
  buildCalendarDays,
  dailyStatusOptions,
  getAttendanceResultTagType,
  isDailyDetailVisible,
} from './data';

defineOptions({ name: 'HrmAttendanceMonthDetail' });

const route = useRoute();
const loading = ref(false);
const detail = ref<HrmAttendanceStatisticsApi.MonthDetail>();
const dailyStatusFilter =
  ref<(typeof dailyStatusOptions)[number]['value']>('all');
const leaveTypeFilter = ref<string>();

const leaveTypeOptions = getDictOptions(
  DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE,
  'string',
);

const employeeId = computed(() => Number(route.params.employeeId));
const year = computed(() => Number(route.query.year) || dayjs().year());
const month = computed(() => Number(route.query.month) || dayjs().month() + 1);
const yearMonth = computed(
  () => `${year.value}-${String(month.value).padStart(2, '0')}`,
);
const calendarDays = computed(() =>
  buildCalendarDays(yearMonth.value, detail.value?.dailyDetails),
);
const filteredLeaveList = computed(() =>
  (detail.value?.leaves || []).filter(
    (item) => !leaveTypeFilter.value || item.type === leaveTypeFilter.value,
  ),
);

async function getDetail() {
  if (!employeeId.value || !dayjs(`${yearMonth.value}-01`).isValid()) {
    return;
  }
  loading.value = true;
  try {
    detail.value = await getAttendanceMonthDetail({
      employeeId: employeeId.value,
      year: year.value,
      month: month.value,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(getDetail);
watch([employeeId, year, month], getDetail);
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading">
      <ElCard class="mb-4" shadow="never">
        <ElDescriptions v-if="detail" :column="4" border size="small">
          <ElDescriptionsItem label="员工">
            {{ detail.summary.employeeName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="工号">
            {{ detail.summary.jobNumber || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="部门">
            {{ detail.summary.deptName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="岗位">
            {{ detail.summary.postName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="考勤组">
            {{ detail.summary.attendanceGroupName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="入职时间">
            {{ formatHrmDateTime(detail.summary.entryTime?.valueOf()) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="员工状态">
            <DictTag
              v-if="detail.summary.employeeStatus !== undefined"
              :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
              :value="detail.summary.employeeStatus"
            />
            <span v-else>-</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="工作城市">
            {{ detail.summary.workCity || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="月份">{{ yearMonth }}</ElDescriptionsItem>
          <ElDescriptionsItem label="应出勤">
            {{ detail.summary.attendDays || 0 }} 天
          </ElDescriptionsItem>
          <ElDescriptionsItem label="实际出勤">
            {{ formatHrmDays(detail.summary.actualDays) }} 天
          </ElDescriptionsItem>
          <ElDescriptionsItem label="是否全勤">
            {{ detail.summary.fullAttendance ? '是' : '否' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="迟到">
            {{ detail.summary.lateCount || 0 }} 次 /
            {{ detail.summary.lateMinute || 0 }} 分钟
          </ElDescriptionsItem>
          <ElDescriptionsItem label="早退">
            {{ detail.summary.earlyCount || 0 }} 次 /
            {{ detail.summary.earlyMinute || 0 }} 分钟
          </ElDescriptionsItem>
          <ElDescriptionsItem label="缺卡">
            {{ detail.summary.misscardCount || 0 }} 次
          </ElDescriptionsItem>
          <ElDescriptionsItem label="旷工">
            {{ formatHrmDays(detail.summary.absenteeismDays) }} 天
          </ElDescriptionsItem>
          <ElDescriptionsItem label="请假">
            {{ formatHrmDays(detail.summary.leaveDays) }} 天
          </ElDescriptionsItem>
          <ElDescriptionsItem label="考勤扣款">
            {{ formatHrmMoney(detail.summary.attendanceDeductAmount) }} 元
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <ElCard class="mb-4" shadow="never">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span class="text-base font-semibold">
            {{ formatDate(`${yearMonth}-01`, 'YYYY 年 MM 月') }}
          </span>
          <ElRadioGroup v-model="dailyStatusFilter">
            <ElRadioButton
              v-for="item in dailyStatusOptions"
              :key="String(item.value)"
              :value="item.value"
            >
              {{ item.label }}
            </ElRadioButton>
          </ElRadioGroup>
        </div>
        <div class="overflow-x-auto">
          <div
            class="border-border min-w-[980px] overflow-hidden border-l border-t"
          >
            <div class="bg-muted grid grid-cols-7">
              <div
                v-for="weekDay in HRM_WEEK_OPTIONS"
                :key="weekDay.value"
                class="border-border border-b border-r py-3 text-center font-semibold"
              >
                {{ weekDay.label }}
              </div>
            </div>
            <div class="grid grid-cols-7">
              <div
                v-for="day in calendarDays"
                :key="day.date"
                class="border-border min-h-[150px] border-b border-r p-2"
                :class="{ 'bg-muted/50': !day.currentMonth }"
              >
                <div class="mb-2 flex items-center justify-between">
                  <span
                    :class="
                      day.currentMonth
                        ? 'font-semibold'
                        : 'text-muted-foreground'
                    "
                  >
                    {{ day.day }}
                  </span>
                  <ElTag
                    v-if="day.detail?.attendanceResult"
                    :type="
                      getAttendanceResultTagType(day.detail.attendanceResult)
                    "
                    size="small"
                  >
                    {{ day.detail.attendanceResult }}
                  </ElTag>
                </div>
                <template
                  v-if="
                    day.currentMonth &&
                    day.detail &&
                    isDailyDetailVisible(day.detail, dailyStatusFilter)
                  "
                >
                  <div class="text-muted-foreground mb-1.5 text-xs">
                    {{ day.detail.shiftName || '未排班' }}
                  </div>
                  <div
                    v-for="clock in day.detail.clockList || []"
                    :key="clock.id || String(clock.clockTime)"
                    class="mb-1 flex items-center justify-between gap-1.5 text-xs"
                  >
                    <DictTag
                      :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE"
                      :value="clock.type"
                    />
                    <span class="flex-1 text-right">
                      {{ formatDate(clock.clockTime, 'HH:mm') || '-' }}
                    </span>
                    <DictTag
                      :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS"
                      :value="clock.status ?? ''"
                    />
                  </div>
                  <div
                    v-if="day.detail.leaveMinutes"
                    class="text-primary mt-1 text-xs"
                  >
                    请假 {{ formatHrmDays(day.detail.leaveDays) }} 天
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </ElCard>

      <ElCard shadow="never">
        <template #header>请假记录</template>
        <div class="mb-4">
          <ElSelect
            v-model="leaveTypeFilter"
            clearable
            class="!w-60"
            placeholder="请选择请假类型"
          >
            <ElOption
              v-for="item in leaveTypeOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </div>
        <ElTable :data="filteredLeaveList" row-key="id" size="small">
          <ElTableColumn label="类型" prop="type" width="120">
            <template #default="{ row }">
              <DictTag
                :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE"
                :value="row.type"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="开始时间" prop="startTime" width="180">
            <template #default="{ row }">
              {{ formatHrmDateTime(row.startTime) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="结束时间" prop="endTime" width="180">
            <template #default="{ row }">
              {{ formatHrmDateTime(row.endTime) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="时长" prop="day" width="100">
            <template #default="{ row }">
              {{ formatHrmDays(row.day) }} 天
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="事由"
            min-width="180"
            prop="reason"
            show-overflow-tooltip
          />
        </ElTable>
      </ElCard>
    </div>
  </Page>
</template>
