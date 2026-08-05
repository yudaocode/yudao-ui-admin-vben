<script lang="ts" setup>
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate } from '@vben/utils';

import {
  Card,
  Descriptions,
  DescriptionsItem,
  RadioButton,
  RadioGroup,
  Select,
  Spin,
  Table,
  Tag,
} from 'antdv-next';
import dayjs from 'dayjs';

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
  getAttendanceResultTagColor,
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

const leaveColumns = [
  { title: '类型', dataIndex: 'type', width: 120 },
  { title: '开始时间', dataIndex: 'startTime', width: 180 },
  { title: '结束时间', dataIndex: 'endTime', width: 180 },
  { title: '时长', dataIndex: 'day', width: 100 },
  { title: '事由', dataIndex: 'reason', ellipsis: true },
];

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
    <Spin :spinning="loading">
      <Card class="mb-4">
        <Descriptions v-if="detail" :column="4" bordered size="small">
          <DescriptionsItem label="员工">
            {{ detail.summary.employeeName || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="工号">
            {{ detail.summary.jobNumber || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="部门">
            {{ detail.summary.deptName || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="岗位">
            {{ detail.summary.postName || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="考勤组">
            {{ detail.summary.attendanceGroupName || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="入职时间">
            {{ formatHrmDateTime(detail.summary.entryTime) }}
          </DescriptionsItem>
          <DescriptionsItem label="员工状态">
            <DictTag
              v-if="detail.summary.employeeStatus !== undefined"
              :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
              :value="detail.summary.employeeStatus"
            />
            <span v-else>-</span>
          </DescriptionsItem>
          <DescriptionsItem label="工作城市">
            {{ detail.summary.workCity || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="月份">{{ yearMonth }}</DescriptionsItem>
          <DescriptionsItem label="应出勤">
            {{ detail.summary.attendDays || 0 }} 天
          </DescriptionsItem>
          <DescriptionsItem label="实际出勤">
            {{ formatHrmDays(detail.summary.actualDays) }} 天
          </DescriptionsItem>
          <DescriptionsItem label="是否全勤">
            {{ detail.summary.fullAttendance ? '是' : '否' }}
          </DescriptionsItem>
          <DescriptionsItem label="迟到">
            {{ detail.summary.lateCount || 0 }} 次 /
            {{ detail.summary.lateMinute || 0 }} 分钟
          </DescriptionsItem>
          <DescriptionsItem label="早退">
            {{ detail.summary.earlyCount || 0 }} 次 /
            {{ detail.summary.earlyMinute || 0 }} 分钟
          </DescriptionsItem>
          <DescriptionsItem label="缺卡">
            {{ detail.summary.misscardCount || 0 }} 次
          </DescriptionsItem>
          <DescriptionsItem label="旷工">
            {{ formatHrmDays(detail.summary.absenteeismDays) }} 天
          </DescriptionsItem>
          <DescriptionsItem label="请假">
            {{ formatHrmDays(detail.summary.leaveDays) }} 天
          </DescriptionsItem>
          <DescriptionsItem label="考勤扣款">
            {{ formatHrmMoney(detail.summary.attendanceDeductAmount) }} 元
          </DescriptionsItem>
        </Descriptions>
      </Card>

      <Card class="mb-4">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span class="text-base font-semibold">
            {{ formatDate(`${yearMonth}-01`, 'YYYY 年 MM 月') }}
          </span>
          <RadioGroup v-model:value="dailyStatusFilter" button-style="solid">
            <RadioButton
              v-for="item in dailyStatusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </RadioButton>
          </RadioGroup>
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
                  <Tag
                    v-if="day.detail?.attendanceResult"
                    :color="
                      getAttendanceResultTagColor(day.detail.attendanceResult)
                    "
                  >
                    {{ day.detail.attendanceResult }}
                  </Tag>
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
      </Card>

      <Card title="请假记录">
        <div class="mb-4">
          <Select
            v-model:value="leaveTypeFilter"
            allow-clear
            class="w-60"
            placeholder="请选择请假类型"
            :options="leaveTypeOptions"
          />
        </div>
        <Table
          :columns="leaveColumns"
          :data-source="filteredLeaveList"
          :pagination="false"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'type'">
              <DictTag
                :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE"
                :value="record.type"
              />
            </template>
            <template v-else-if="column.dataIndex === 'startTime'">
              {{ formatHrmDateTime(record.startTime) }}
            </template>
            <template v-else-if="column.dataIndex === 'endTime'">
              {{ formatHrmDateTime(record.endTime) }}
            </template>
            <template v-else-if="column.dataIndex === 'day'">
              {{ formatHrmDays(record.day) }} 天
            </template>
          </template>
        </Table>
      </Card>
    </Spin>
  </Page>
</template>
