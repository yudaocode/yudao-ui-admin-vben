<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { onMounted, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { HolidayType } from '@vben/constants';

import { Button, Calendar, message, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';
import { SolarDay } from 'tyme4ts';

import { getHolidayList } from '#/api/mes/cal/holiday';

import HolidayForm from './modules/form.vue';

import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const currentDate = ref<Dayjs>(dayjs()); // 当前日历选中日期
const holidaySet = ref(new Set<string>()); // 节假日日期集合
const lastFetchedMonth = ref(''); // 上次加载月份
const { hasAccessByCodes } = useAccess();

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
function handleDayClick(date: Dayjs) {
  // 非当前月日期，不处理（避免切换月份）
  if (!date.isSame(currentDate.value, 'month')) {
    return;
  }
  if (!hasAccessByCodes(['mes:cal-holiday:create'])) {
    message.warning('没有假期设置权限');
    return;
  }
  holidayFormModalApi.setData({ day: date.format('YYYY-MM-DD') }).open();
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
      <Calendar v-model:value="currentDate" class="mes-holiday-calendar">
        <template #headerRender>
          <div class="flex items-center justify-between p-3">
            <div class="text-base font-medium">
              {{ currentDate.format('YYYY 年 MM 月') }}
            </div>
            <div class="flex items-center gap-2">
              <Button @click="handlePrevMonth">上月</Button>
              <Button @click="handleToday">今天</Button>
              <Button @click="handleNextMonth">下月</Button>
            </div>
          </div>
        </template>
        <template #dateFullCellRender="{ current: date }">
          <div
            class="hover:bg-muted/50 h-[84px] cursor-pointer p-2 text-left transition"
            @click.stop="handleDayClick(date)"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-base font-medium"
                :class="{
                  'text-red-500':
                    isWeekend(date.format('YYYY-MM-DD')) &&
                    date.isSame(currentDate, 'month'),
                }"
              >
                {{ date.format('DD') }}
              </span>
              <Tag
                v-if="
                  date.isSame(currentDate, 'month') &&
                  holidaySet.has(date.format('YYYY-MM-DD'))
                "
                color="green"
              >
                休
              </Tag>
              <Tag v-else-if="date.isSame(currentDate, 'month')" color="blue">
                班
              </Tag>
            </div>
            <div
              class="mt-1 text-xs"
              :class="
                hasFestival(date.format('YYYY-MM-DD'))
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              "
            >
              {{ getLunarDisplay(date.format('YYYY-MM-DD')) }}
            </div>
          </div>
        </template>
      </Calendar>
    </div>
  </Page>
</template>

<style lang="scss" scoped>
/* 重置 Ant Design Calendar 的默认对齐和内边距，使用自定义单元格 */
.mes-holiday-calendar {
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
