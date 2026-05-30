<script lang="ts" setup>
import type { MesCalCalendarApi } from '#/api/mes/cal/calendar';

import { computed } from 'vue';

import { MesCalShiftTypeEnum } from '@vben/constants';

import dayjs from 'dayjs';
import { ElTag } from 'element-plus';
import { SolarDay } from 'tyme4ts';

const props = defineProps<{
  calendarDayMap: Map<string, MesCalCalendarApi.CalendarDay>; // 排班数据
  day: string; // 日期，格式 yyyy-MM-dd
  holidaySet: Set<string>; // 节假日集合
}>();

const dayNumber = computed(() => props.day.split('-')[2] || '');
const isHoliday = computed(() => props.holidaySet.has(props.day));
const isWeekend = computed(() => {
  const weekday = dayjs(props.day).day();
  return weekday === 0 || weekday === 6; // 0=周日，6=周六
});

const calDay = computed(() => props.calendarDayMap.get(props.day));
const teamShifts = computed(() => calDay.value?.teamShifts || []);
const shiftType = computed(() => calDay.value?.shiftType);

/**
 * 班次标签展示数据：根据 sort 与 shiftType 推导背景色
 *
 * 配色规则（sort 对应轮班方式中的班次顺序）：
 *   sort=1 白班 → 绿色（#95d475）
 *   sort=2 中班 → 三班倒用橙色（#f0a020），两班倒用灰色（#909399）
 *   sort=3 夜班 → 灰色（#909399）
 */
const displayShifts = computed(() => {
  const isThreeShift = shiftType.value === MesCalShiftTypeEnum.THREE;
  const colorMap: Record<number, string> = {
    1: 'bg-[#95d475]',
    2: isThreeShift ? 'bg-[#f0a020]' : 'bg-[#909399]',
    3: 'bg-[#909399]',
  };
  return teamShifts.value
    .map((item) => {
      const bgClass = colorMap[item.sort ?? -1];
      if (!bgClass) {
        return null;
      }
      return {
        bgClass,
        key: `${item.teamId}-${item.shiftId}`,
        label: `${item.shiftName} · ${item.teamName}`,
      };
    })
    .filter((v): v is { bgClass: string; key: string; label: string } => !!v);
});

/** 解析当天的农历、节气、节日信息 */
const lunarInfo = computed(() => {
  const [year, month, date] = props.day.split('-').map(Number);
  try {
    const solarDay = SolarDay.fromYmd(year!, month!, date!);
    const lunarDay = solarDay.getLunarDay();
    const solarFestival = solarDay.getFestival();
    const lunarFestival = lunarDay.getFestival();
    const termDay = solarDay.getTermDay();
    const termName =
      termDay.getDayIndex() === 0 ? termDay.getSolarTerm().getName() : '';
    const lunarMonthName = lunarDay.getLunarMonth().getName();
    const lunarDayName = lunarDay.getName();
    return {
      lunarFestival: lunarFestival ? lunarFestival.getName() : '',
      lunarText: lunarMonthName + lunarDayName,
      solarFestival: solarFestival ? solarFestival.getName() : '',
      termName,
    };
  } catch {
    return {
      lunarFestival: '',
      lunarText: '',
      solarFestival: '',
      termName: '',
    };
  }
});

const lunarDisplay = computed(() => {
  const info = lunarInfo.value;
  return (
    info.solarFestival || info.lunarFestival || info.termName || info.lunarText
  );
});

const hasFestivalDay = computed(() => {
  const info = lunarInfo.value;
  return Boolean(info.solarFestival || info.lunarFestival || info.termName);
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden p-1">
    <!-- 顶部：日期数字 + 上班/休息标签 -->
    <div class="flex shrink-0 items-center justify-between">
      <span class="text-base font-medium" :class="{ 'text-red-500': isWeekend }">
        {{ dayNumber }}
      </span>
      <ElTag v-if="isHoliday" effect="dark" size="small" type="success">
        休
      </ElTag>
      <ElTag v-else effect="dark" size="small">班</ElTag>
    </div>
    <!-- 农历 / 节气 / 节日显示 -->
    <div
      class="mt-0.5 shrink-0 truncate text-[11px]"
      :class="hasFestivalDay ? 'text-green-600' : 'text-muted-foreground'"
    >
      {{ lunarDisplay }}
    </div>
    <!--
      班次列表：节假日不显示排班
      配色规则与背景类由 displayShifts 计算
    -->
    <div v-if="!isHoliday" class="mt-0.5 flex flex-col gap-px overflow-hidden">
      <div
        v-for="shift in displayShifts"
        :key="shift.key"
        class="block w-full truncate rounded-sm px-1 py-px text-[11px] leading-normal text-white"
        :class="shift.bgClass"
      >
        {{ shift.label }}
      </div>
    </div>
  </div>
</template>
