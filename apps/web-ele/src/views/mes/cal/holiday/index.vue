<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, onMounted, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { HolidayType } from '@vben/constants';

import dayjs from 'dayjs';
import { ElCalendar, ElMessage, ElTag } from 'element-plus';
import { SolarDay } from 'tyme4ts';

import { getHolidayList } from '#/api/mes/cal/holiday';

import HolidayForm from './modules/form.vue';

import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const currentDate = ref<Dayjs>(dayjs()); // 当前日历选中日期
const holidaySet = ref(new Set<string>()); // 节假日日期集合
const lastFetchedMonth = ref(''); // 上次加载月份
const { hasAccessByCodes } = useAccess();

/** ElCalendar v-model 桥接：内部用 Dayjs，组件需要 Date */
const calendarValue = computed({
  get: () => currentDate.value.toDate(),
  set: (val: Date) => {
    currentDate.value = dayjs(val);
  },
});

const [HolidayFormModal, holidayFormModalApi] = useVbenModal({
  connectedComponent: HolidayForm,
  destroyOnClose: true,
});

/** 加载假期列表（按当前日历可见范围过滤） */
async function getList() {
  const current = currentDate.value;
  const startDay = current
    .subtract(1, 'month')
    .startOf('month')
    .format('YYYY-MM-DD 00:00:00');
  const endDay = current
    .add(1, 'month')
    .endOf('month')
    .format('YYYY-MM-DD 23:59:59');
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

/** 点击日期：打开假期设置弹窗 */
function handleDayClick(data: { date: Date; day: string; type: string }) {
  // 非当前月日期，不处理（避免切换月份）
  if (data.type !== 'current-month') {
    return;
  }
  if (!hasAccessByCodes(['mes:cal-holiday:create'])) {
    ElMessage.warning('没有假期设置权限');
    return;
  }
  holidayFormModalApi.setData({ day: data.day }).open();
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
    const termName =
      termDay.getDayIndex() === 0 ? termDay.getSolarTerm().getName() : '';
    return {
      lunarFestival: lunarFestival ? lunarFestival.getName() : '',
      lunarText: lunarDay.getLunarMonth().getName() + lunarDay.getName(),
      solarFestival: solarFestival ? solarFestival.getName() : '',
      termName,
    };
  } catch {
    return { lunarFestival: '', lunarText: '', solarFestival: '', termName: '' };
  }
}

/** 获取农历显示文本 */
function getLunarDisplay(day: string) {
  const info = getLunarInfo(day);
  return (
    info.solarFestival || info.lunarFestival || info.termName || info.lunarText
  );
}

/** 判断是否有节日 */
function hasFestival(day: string) {
  const info = getLunarInfo(day);
  return !!(info.solarFestival || info.lunarFestival || info.termName);
}

/** 监听月份切换，重新加载可见范围内的数据 */
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
      <DocAlert
        title="【排班】班组设置、节假日设置"
        url="https://doc.iocoder.cn/mes/cal/team/"
      />
    </template>
    <HolidayFormModal @success="getList" />
    <div class="bg-card overflow-hidden rounded-md">
      <ElCalendar v-model="calendarValue" class="mes-holiday-calendar">
        <template #date-cell="{ data }">
          <div
            class="hover:bg-muted/50 h-full cursor-pointer p-1 text-left transition"
            @click.stop="handleDayClick(data)"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-base font-medium"
                :class="{
                  'text-red-500':
                    isWeekend(data.day) && data.type === 'current-month',
                }"
              >
                {{ data.day.split('-')[2] }}
              </span>
              <ElTag
                v-if="holidaySet.has(data.day)"
                effect="dark"
                size="small"
                type="success"
              >
                休
              </ElTag>
              <ElTag v-else effect="dark" size="small">班</ElTag>
            </div>
            <div
              class="mt-1 text-xs"
              :class="
                hasFestival(data.day)
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              "
            >
              {{ getLunarDisplay(data.day) }}
            </div>
          </div>
        </template>
      </ElCalendar>
    </div>
  </Page>
</template>

<style lang="scss" scoped>
/* 收紧 ElCalendar 默认日期单元高度 */
.mes-holiday-calendar {
  :deep(.el-calendar-table .el-calendar-day) {
    height: 90px;
    padding: 4px;
  }
}
</style>
