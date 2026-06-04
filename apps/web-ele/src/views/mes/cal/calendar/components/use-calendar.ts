import type { Dayjs } from 'dayjs';

import type { MesCalCalendarApi } from '#/api/mes/cal/calendar';

import { ref, watch } from 'vue';

import { HolidayType } from '@vben/constants';

import dayjs from 'dayjs';

import { getCalendarList } from '#/api/mes/cal/calendar';
import { getHolidayList } from '#/api/mes/cal/holiday';

/**
 * 排班日历通用 composable
 *
 * 封装日历组件中通用的响应式状态、假期加载、排班查询、月份切换逻辑
 */
export function useCalendar() {
  const loading = ref(false);
  const currentDate = ref<Dayjs>(dayjs());
  const calendarDayMap = ref<Map<string, MesCalCalendarApi.CalendarDay>>(
    new Map(),
  );
  const holidaySet = ref(new Set<string>());

  /** 计算当前月份的起止时间 */
  function getMonthRange() {
    const startDay = currentDate.value
      .startOf('month')
      .format('YYYY-MM-DD 00:00:00');
    const endDay = currentDate.value
      .endOf('month')
      .format('YYYY-MM-DD 23:59:59');
    return { endDay, startDay };
  }

  /**
   * 获取节假日列表，按当前月份范围加载
   *
   * 失败（无权限 / 接口异常）时不抛出，仅清空当月假期标记，
   * 避免阻断使用方的主数据初始化
   */
  async function loadHolidays() {
    const { endDay, startDay } = getMonthRange();
    const days = new Set<string>();
    try {
      const list = await getHolidayList({ endDay, startDay });
      for (const item of list || []) {
        const day = item.day ? dayjs(item.day).format('YYYY-MM-DD') : '';
        if (day && item.type === HolidayType.HOLIDAY) {
          days.add(day);
        }
      }
    } catch {
      // 没有 mes:cal-holiday:query 权限或接口异常时，仅忽略假期标记
    }
    holidaySet.value = days;
  }

  /** 查询排班日历，params 由调用方提供 queryType 相关参数 */
  async function fetchCalendar(params: Record<string, any>) {
    loading.value = true;
    try {
      const { endDay, startDay } = getMonthRange();
      const list = await getCalendarList({ ...params, endDay, startDay });
      const map = new Map<string, MesCalCalendarApi.CalendarDay>();
      for (const item of list || []) {
        const day = item.day ? dayjs(item.day).format('YYYY-MM-DD') : '';
        if (day) {
          map.set(day, { ...item, day });
        }
      }
      calendarDayMap.value = map;
    } finally {
      loading.value = false;
    }
  }

  /** 监听月份切换，调用回调刷新数据 */
  function watchMonth(callback: () => void) {
    watch(
      () => currentDate.value.format('YYYY-MM'),
      () => {
        void loadHolidays();
        callback();
      },
    );
  }

  return {
    calendarDayMap,
    currentDate,
    fetchCalendar,
    holidaySet,
    loadHolidays,
    loading,
    watchMonth,
  };
}
