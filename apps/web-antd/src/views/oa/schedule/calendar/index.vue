<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { OaScheduleApi } from '#/api/oa/schedule';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, getAllPageItems } from '@vben/utils';

import {
  Button,
  Calendar,
  Checkbox,
  Empty,
  Input,
  RadioButton,
  RadioGroup,
  Select,
  Spin,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getSchedulePage } from '#/api/oa/schedule';
import Detail from '#/views/oa/schedule/list/modules/detail.vue';
import Form from '#/views/oa/schedule/list/modules/form.vue';
import { OA_WEEKDAY_NAMES } from '#/views/oa/utils/constants';
import { getOaPriorityStyle } from '#/views/oa/utils/format';

defineOptions({ name: 'OaScheduleCalendar' });

const { hasAccessByCodes } = useAccess();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

const queryParams = reactive({
  includeMine: true,
  includeReceived: true,
  title: undefined,
  type: undefined,
  priority: undefined,
}); // 查询参数
const typeOptions = getDictOptions(DICT_TYPE.OA_SCHEDULE_TYPE, 'number'); // 日程类型选项
const priorityOptions = getDictOptions(DICT_TYPE.OA_PRIORITY, 'number'); // 优先级选项
const calendarLoading = ref(false); // 日历加载中
const calendarDate = ref<Dayjs>(dayjs()); // 当前日历日期
const calendarView = ref<'day' | 'month' | 'week'>('month'); // 当前视图
const viewLabel = computed(
  () => ({ day: '日', month: '月', week: '周' })[calendarView.value],
); // 视图周期名称
const calendarRange = computed<[string, string]>(() => {
  const date = calendarDate.value;
  let beginTime = date.startOf('day');
  let endTime = date.endOf('day');
  if (calendarView.value === 'month') {
    // 月历会补齐相邻月份的日期；预留首尾一周，兼容不同的周起始日
    beginTime = date.startOf('month').subtract(7, 'day');
    endTime = date.endOf('month').add(7, 'day');
  }
  if (calendarView.value === 'week') {
    // 周视图按周一至周日对齐
    beginTime = beginTime.subtract((beginTime.day() + 6) % 7, 'day');
    endTime = endTime.add(6 - ((endTime.day() + 6) % 7), 'day');
  }
  return [
    beginTime.format('YYYY-MM-DD HH:mm:ss'),
    endTime.format('YYYY-MM-DD HH:mm:ss'),
  ];
}); // 当前视图覆盖的日期范围
const visibleDates = computed(() =>
  Array.from({ length: calendarView.value === 'week' ? 7 : 1 }, (_, index) =>
    dayjs(calendarRange.value[0]).add(index, 'day').format('YYYY-MM-DD'),
  ),
); // 周视图、日视图展示的日期
const calendarTitle = computed(() =>
  calendarView.value === 'month'
    ? calendarDate.value.format('YYYY 年 MM 月')
    : `${calendarRange.value[0].slice(0, 10)} ~ ${calendarRange.value[1].slice(0, 10)}`,
); // 当前视图标题
const calendarList = ref<OaScheduleApi.Schedule[]>([]); // 当前视图日程列表
const calendarScheduleMap = computed(() => {
  const result = new Map<string, OaScheduleApi.Schedule[]>();
  const [rangeBeginTime, rangeEndTime] = calendarRange.value;
  // 跨天日程分别归入覆盖的每个自然日，超出当前显示范围的部分截断
  for (const schedule of calendarList.value) {
    let currentDate = dayjs(schedule.startTime).startOf('day');
    let endDate = dayjs(schedule.endTime).startOf('day');
    if (currentDate.isBefore(rangeBeginTime, 'day')) {
      currentDate = dayjs(rangeBeginTime);
    }
    if (endDate.isAfter(rangeEndTime, 'day')) {
      endDate = dayjs(rangeEndTime).startOf('day');
    }
    while (!currentDate.isAfter(endDate)) {
      const date = currentDate.format('YYYY-MM-DD');
      result.set(date, [...(result.get(date) || []), schedule]);
      currentDate = currentDate.add(1, 'day');
    }
  }
  return result;
}); // 按日期分组的日程

/** 视图或显示区间变化时重新查询 */
watch(
  () => calendarRange.value.join(','),
  () => {
    getCalendarList();
  },
);

/** 查询与当前视图时间范围相交的日程 */
async function getCalendarList() {
  calendarLoading.value = true;
  try {
    calendarList.value = await getAllPageItems<OaScheduleApi.Schedule>(
      (pageNo, pageSize) =>
        getSchedulePage({
          ...queryParams,
          pageNo,
          pageSize,
          overlapTime: [...calendarRange.value],
        }),
    );
  } finally {
    calendarLoading.value = false;
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  getCalendarList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.includeMine = true;
  queryParams.includeReceived = true;
  queryParams.title = undefined;
  queryParams.type = undefined;
  queryParams.priority = undefined;
  handleQuery();
}

/** 获得指定日期的日程 */
function getCalendarDaySchedules(date: string) {
  return calendarScheduleMap.value.get(date) || [];
}

/** 创建日程 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑日程 */
function handleEdit(id: number) {
  formModalApi.setData({ id }).open();
}

/** 查看日程详情 */
function handleDetail(id: number) {
  detailModalApi.setData({ id }).open();
}

/** 切换上一个或下一个显示周期 */
function changePeriod(direction: number) {
  calendarDate.value = calendarDate.value.add(direction, calendarView.value);
}

/** 切换到今天 */
function handleToday() {
  calendarDate.value = dayjs();
}

/** 展开指定日期的全部日程 */
function openDay(date: string) {
  calendarDate.value = dayjs(date);
  calendarView.value = 'day';
}

/** 初始化 */
onMounted(() => {
  getCalendarList();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="getCalendarList" />
    <DetailModal @edit="handleEdit" />

    <!-- 搜索 -->
    <div class="bg-card mb-4 rounded-md p-4">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm">日程范围</span>
        <Checkbox
          v-model:checked="queryParams.includeMine"
          @change="handleQuery"
        >
          我的日程
        </Checkbox>
        <Checkbox
          v-model:checked="queryParams.includeReceived"
          @change="handleQuery"
        >
          共享给我
        </Checkbox>
        <Input
          v-model:value="queryParams.title"
          allow-clear
          class="!w-60"
          placeholder="请输入日程标题"
          @press-enter="handleQuery"
        />
        <Select
          v-model:value="queryParams.type"
          allow-clear
          class="!w-60"
          :options="typeOptions"
          placeholder="请选择日程类型"
        />
        <Select
          v-model:value="queryParams.priority"
          allow-clear
          class="!w-60"
          :options="priorityOptions"
          placeholder="请选择优先级"
        />
        <Button @click="handleQuery">搜索</Button>
        <Button @click="resetQuery">重置</Button>
        <Button
          v-if="hasAccessByCodes(['oa:schedule:create'])"
          type="primary"
          @click="handleCreate"
        >
          新增
        </Button>
      </div>
    </div>

    <!-- 日程日历 -->
    <Spin :spinning="calendarLoading" wrapper-class-name="block">
      <div class="bg-card overflow-hidden rounded-md">
        <!-- 视图切换 -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-3">
          <div class="flex items-center gap-2">
            <Button @click="changePeriod(-1)">上一{{ viewLabel }}</Button>
            <Button @click="handleToday">今天</Button>
            <Button @click="changePeriod(1)">下一{{ viewLabel }}</Button>
            <span class="text-base font-medium">{{ calendarTitle }}</span>
          </div>
          <RadioGroup v-model:value="calendarView">
            <RadioButton value="month">月</RadioButton>
            <RadioButton value="week">周</RadioButton>
            <RadioButton value="day">日</RadioButton>
          </RadioGroup>
        </div>

        <!-- 月视图 -->
        <Calendar
          v-if="calendarView === 'month'"
          v-model:value="calendarDate"
          class="oa-schedule-calendar"
        >
          <template #headerRender></template>
          <template #dateFullCellRender="{ current: date }">
            <div class="h-[110px] overflow-hidden p-1.5 text-left">
              <div
                class="mb-1"
                :class="{
                  'text-muted-foreground/50': !date.isSame(
                    calendarDate,
                    'month',
                  ),
                }"
              >
                {{ date.format('DD') }}
              </div>
              <button
                v-for="schedule in getCalendarDaySchedules(
                  date.format('YYYY-MM-DD'),
                ).slice(0, 3)"
                :key="schedule.id"
                type="button"
                class="mb-[3px] block w-full cursor-pointer truncate rounded-[3px] border-0 px-1 py-[2px] text-left text-xs"
                :style="getOaPriorityStyle(schedule.priority)"
                @click.stop="handleDetail(schedule.id!)"
              >
                {{
                  dayjs(schedule.startTime).isSame(date, 'day')
                    ? formatDate(schedule.startTime, 'HH:mm')
                    : '持续'
                }}
                {{ schedule.title }}
              </button>
              <Button
                v-if="
                  getCalendarDaySchedules(date.format('YYYY-MM-DD')).length > 3
                "
                type="link"
                size="small"
                class="!p-0"
                @click.stop="openDay(date.format('YYYY-MM-DD'))"
              >
                还有
                {{
                  getCalendarDaySchedules(date.format('YYYY-MM-DD')).length - 3
                }}
                项
              </Button>
            </div>
          </template>
        </Calendar>

        <!-- 周视图和日视图 -->
        <div v-else class="overflow-x-auto">
          <div
            class="grid"
            :style="{
              gridTemplateColumns: `repeat(${visibleDates.length}, minmax(140px, 1fr))`,
            }"
          >
            <div
              v-for="date in visibleDates"
              :key="date"
              class="border-border min-h-60 border border-solid p-3"
            >
              <Button type="link" class="mb-3 !px-0" @click="openDay(date)">
                {{ dayjs(date).format('MM-DD') }}
                {{ OA_WEEKDAY_NAMES[dayjs(date).day()] }}
              </Button>
              <Empty
                v-if="!getCalendarDaySchedules(date).length"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
                description="暂无日程"
              />
              <button
                v-for="schedule in getCalendarDaySchedules(date)"
                :key="schedule.id"
                type="button"
                class="mb-2 block w-full cursor-pointer whitespace-normal rounded-[3px] border-0 p-1 text-left text-xs"
                :style="getOaPriorityStyle(schedule.priority)"
                @click="handleDetail(schedule.id!)"
              >
                {{
                  dayjs(schedule.startTime).isSame(date, 'day')
                    ? formatDate(schedule.startTime, 'HH:mm')
                    : '持续'
                }}
                {{ schedule.title }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Spin>
  </Page>
</template>

<style lang="scss" scoped>
.oa-schedule-calendar {
  :deep(.ant-picker-content) {
    border-top: 1px solid hsl(var(--border));
    border-left: 1px solid hsl(var(--border));

    th {
      padding: 8px 12px;
      text-align: left;
      background: transparent;
      border-right: 1px solid hsl(var(--border));
      border-bottom: 1px solid hsl(var(--border));
    }

    td {
      padding: 0;
      border-right: 1px solid hsl(var(--border));
      border-bottom: 1px solid hsl(var(--border));
    }
  }

  :deep(.ant-picker-cell) {
    padding: 0;

    &::before {
      display: none;
    }
  }
}
</style>
