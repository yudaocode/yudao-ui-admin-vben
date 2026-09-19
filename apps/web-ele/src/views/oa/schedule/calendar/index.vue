<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { OaScheduleApi } from '#/api/oa/schedule';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, getAllPageItems } from '@vben/utils';

import dayjs from 'dayjs';
import {
  ElButton,
  ElCalendar,
  ElCard,
  ElCheckbox,
  ElEmpty,
  ElInput,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

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

/** ElCalendar v-model 桥接：内部用 Dayjs，组件需要 Date */
const calendarValue = computed({
  get: () => calendarDate.value.toDate(),
  set: (val: Date) => {
    calendarDate.value = dayjs(val);
  },
});

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
    <ElCard shadow="never" class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm">日程范围</span>
        <ElCheckbox v-model="queryParams.includeMine" @change="handleQuery">
          我的日程
        </ElCheckbox>
        <ElCheckbox v-model="queryParams.includeReceived" @change="handleQuery">
          共享给我
        </ElCheckbox>
        <ElInput
          v-model="queryParams.title"
          clearable
          class="!w-60"
          placeholder="请输入日程标题"
          @keyup.enter="handleQuery"
        />
        <ElSelect
          v-model="queryParams.type"
          clearable
          class="!w-60"
          placeholder="请选择日程类型"
        >
          <ElOption
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect
          v-model="queryParams.priority"
          clearable
          class="!w-60"
          placeholder="请选择优先级"
        >
          <ElOption
            v-for="item in priorityOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElButton @click="handleQuery">搜索</ElButton>
        <ElButton @click="resetQuery">重置</ElButton>
        <ElButton
          v-if="hasAccessByCodes(['oa:schedule:create'])"
          type="primary"
          @click="handleCreate"
        >
          新增
        </ElButton>
      </div>
    </ElCard>

    <!-- 日程日历 -->
    <ElCard shadow="never" v-loading="calendarLoading">
      <!-- 视图切换 -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <ElButton @click="changePeriod(-1)">上一{{ viewLabel }}</ElButton>
          <ElButton @click="handleToday">今天</ElButton>
          <ElButton @click="changePeriod(1)">下一{{ viewLabel }}</ElButton>
          <span class="text-base font-medium">{{ calendarTitle }}</span>
        </div>
        <ElRadioGroup v-model="calendarView">
          <ElRadioButton value="month">月</ElRadioButton>
          <ElRadioButton value="week">周</ElRadioButton>
          <ElRadioButton value="day">日</ElRadioButton>
        </ElRadioGroup>
      </div>

      <!-- 月视图 -->
      <ElCalendar
        v-if="calendarView === 'month'"
        v-model="calendarValue"
        class="oa-schedule-calendar"
      >
        <template #header><span></span></template>
        <template #date-cell="{ data }">
          <div class="h-full overflow-hidden">
            <div
              class="mb-1"
              :class="{
                'text-muted-foreground/50': data.type !== 'current-month',
              }"
            >
              {{ data.day.split('-')[2] }}
            </div>
            <button
              v-for="schedule in getCalendarDaySchedules(data.day).slice(0, 3)"
              :key="schedule.id"
              type="button"
              class="mb-[3px] block w-full cursor-pointer truncate rounded-[3px] border-0 px-1 py-[2px] text-left text-xs"
              :style="getOaPriorityStyle(schedule.priority)"
              @click.stop="handleDetail(schedule.id!)"
            >
              {{
                dayjs(schedule.startTime).isSame(data.day, 'day')
                  ? formatDate(schedule.startTime, 'HH:mm')
                  : '持续'
              }}
              {{ schedule.title }}
            </button>
            <ElButton
              v-if="getCalendarDaySchedules(data.day).length > 3"
              link
              type="primary"
              @click.stop="openDay(data.day)"
            >
              还有 {{ getCalendarDaySchedules(data.day).length - 3 }} 项
            </ElButton>
          </div>
        </template>
      </ElCalendar>

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
            <ElButton link class="mb-3" @click="openDay(date)">
              {{ dayjs(date).format('MM-DD') }}
              {{ OA_WEEKDAY_NAMES[dayjs(date).day()] }}
            </ElButton>
            <ElEmpty
              v-if="!getCalendarDaySchedules(date).length"
              description="暂无日程"
              :image-size="40"
            />
            <ElButton
              v-for="schedule in getCalendarDaySchedules(date)"
              :key="schedule.id"
              link
              class="!ml-0 mb-2 !block w-full !whitespace-normal rounded-[3px] !p-1 !text-left"
              :style="getOaPriorityStyle(schedule.priority)"
              @click="handleDetail(schedule.id!)"
            >
              {{
                dayjs(schedule.startTime).isSame(date, 'day')
                  ? formatDate(schedule.startTime, 'HH:mm')
                  : '持续'
              }}
              {{ schedule.title }}
            </ElButton>
          </div>
        </div>
      </div>
    </ElCard>
  </Page>
</template>

<style lang="scss" scoped>
.oa-schedule-calendar {
  :deep(.el-calendar__header) {
    display: none;
  }

  /* 收紧 ElCalendar 默认日期单元高度，使用自定义单元 */
  :deep(.el-calendar-table .el-calendar-day) {
    height: 110px;
    padding: 6px;
  }
}
</style>
