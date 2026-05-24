<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { Button, message, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';
import { SolarDay } from 'tyme4ts';

import { getHolidayList } from '#/api/mes/cal/holiday';
import { HolidayType } from '#/views/mes/utils/constants';

import HolidayForm from './modules/form.vue';

import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const currentDate = ref(dayjs()); // 当前日历月份
const holidaySet = ref(new Set<string>()); // 节假日日期集合
const lastFetchedMonth = ref(''); // 上次加载月份
const { hasAccessByCodes } = useAccess();

const [HolidayFormModal, holidayFormModalApi] = useVbenModal({
  connectedComponent: HolidayForm,
  destroyOnClose: true,
});

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']; // 星期标题
const calendarDays = computed(() => {
  const monthStart = currentDate.value.startOf('month');
  const start = monthStart.subtract(monthStart.day(), 'day');
  return Array.from({ length: 42 }, (_, index) => {
    const date = start.add(index, 'day');
    return { day: date.format('YYYY-MM-DD'), inMonth: date.month() === currentDate.value.month() };
  });
});
const currentMonthTitle = computed(() => currentDate.value.format('YYYY 年 MM 月'));

/** 加载假期列表 */
async function getList() {
  holidaySet.value = new Set<string>();
  const current = currentDate.value;
  const startDay = current.subtract(1, 'month').startOf('month').format('YYYY-MM-DD 00:00:00');
  const endDay = current.add(1, 'month').endOf('month').format('YYYY-MM-DD 23:59:59');
  const list = await getHolidayList({ startDay, endDay });
  const days = new Set<string>();
  for (const item of list || []) {
    const day = item.day ? dayjs(item.day).format('YYYY-MM-DD') : '';
    if (day && item.type === HolidayType.HOLIDAY) {
      days.add(day);
    }
  }
  holidaySet.value = days;
  lastFetchedMonth.value = current.format('YYYY-MM');
}

/** 打开假期设置表单 */
function handleDayClick(item: { day: string; inMonth: boolean }) {
  if (!item.inMonth) {
    return;
  }
  if (!hasAccessByCodes(['mes:cal-holiday:create'])) {
    message.warning('没有假期设置权限');
    return;
  }
  holidayFormModalApi.setData({ day: item.day }).open();
}

/** 切换到上月 */
function handlePrevMonth() {
  currentDate.value = currentDate.value.subtract(1, 'month');
}

/** 切换到下月 */
function handleNextMonth() {
  currentDate.value = currentDate.value.add(1, 'month');
}

/** 切换到今天 */
function handleToday() {
  currentDate.value = dayjs();
}

/** 判断是否周末 */
function isWeekend(day: string) {
  const weekday = dayjs(day).day();
  return weekday === 0 || weekday === 6;
}

/** 获取农历信息 */
function getLunarInfo(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  try {
    const solarDay = SolarDay.fromYmd(year!, month!, date!);
    const lunarDay = solarDay.getLunarDay();
    const solarFestival = solarDay.getFestival();
    const lunarFestival = lunarDay.getFestival();
    const termDay = solarDay.getTermDay();
    const termName = termDay.getDayIndex() === 0 ? termDay.getSolarTerm().getName() : '';
    return {
      solarFestival: solarFestival ? solarFestival.getName() : '',
      lunarFestival: lunarFestival ? lunarFestival.getName() : '',
      termName,
      lunarText: lunarDay.getLunarMonth().getName() + lunarDay.getName(),
    };
  } catch {
    return { solarFestival: '', lunarFestival: '', termName: '', lunarText: '' };
  }
}

/** 获取农历显示文本 */
function getLunarDisplay(day: string) {
  const info = getLunarInfo(day);
  return info.solarFestival || info.lunarFestival || info.termName || info.lunarText;
}

/** 判断是否有节日 */
function hasFestival(day: string) {
  const info = getLunarInfo(day);
  return !!(info.solarFestival || info.lunarFestival || info.termName);
}

watch(currentDate, (newDate) => {
  const newMonth = newDate.format('YYYY-MM');
  if (newMonth !== lastFetchedMonth.value) {
    getList();
  }
});

onMounted(getList);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="【排班】班组设置、节假日设置" url="https://doc.iocoder.cn/mes/cal/team/" />
    </template>
    <HolidayFormModal @success="getList" />
    <div class="flex h-full flex-col overflow-hidden rounded border bg-background">
      <div class="flex items-center justify-between border-b p-4">
        <div class="text-lg font-semibold">{{ currentMonthTitle }}</div>
        <div class="flex items-center gap-2">
          <Button @click="handlePrevMonth">上月</Button>
          <Button @click="handleToday">今天</Button>
          <Button @click="handleNextMonth">下月</Button>
        </div>
      </div>
      <div class="grid grid-cols-7 border-b text-center text-sm text-muted-foreground">
        <div v-for="label in weekLabels" :key="label" class="py-2">{{ label }}</div>
      </div>
      <div class="grid flex-1 grid-cols-7 grid-rows-6">
        <button
          v-for="item in calendarDays"
          :key="item.day"
          class="min-h-[104px] border-b border-r p-2 text-left transition hover:bg-muted/50"
          :class="{
            'cursor-pointer': item.inMonth,
            'bg-muted/30 text-muted-foreground': !item.inMonth,
          }"
          type="button"
          @click="handleDayClick(item)"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-base font-medium"
              :class="{ 'text-red-500': isWeekend(item.day) && item.inMonth }"
            >
              {{ item.day.slice(8) }}
            </span>
            <template v-if="item.inMonth">
              <span v-if="holidaySet.has(item.day)"><Tag color="green">休</Tag></span>
              <span v-else><Tag color="blue">班</Tag></span>
            </template>
          </div>
          <div
            class="mt-1 text-xs"
            :class="{
              'text-green-600': hasFestival(item.day),
              'text-muted-foreground': !hasFestival(item.day),
            }"
          >
            {{ getLunarDisplay(item.day) }}
          </div>
        </button>
      </div>
    </div>
  </Page>
</template>
