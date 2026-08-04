import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { formatDate } from '@vben/utils';

import dayjs from 'dayjs';

export const dailyStatusOptions = [
  { label: '全部', value: 'all' },
  { label: '实际出勤', value: 'attendance' },
  { label: '迟到', value: 'late' },
  { label: '早退', value: 'early' },
  { label: '旷工', value: 'absenteeism' },
  { label: '缺卡', value: 'misscard' },
] as const;

export type DailyStatusFilter = (typeof dailyStatusOptions)[number]['value'];

/** 获得考勤结果 Tag 颜色（antdv-next） */
export function getAttendanceResultTagColor(
  result?: string,
): 'default' | 'error' | 'success' | 'warning' {
  if (result === '正常') {
    return 'success';
  }
  if (result?.includes('旷工')) {
    return 'error';
  }
  if (
    result?.includes('缺卡') ||
    result?.includes('迟到') ||
    result?.includes('早退')
  ) {
    return 'warning';
  }
  return 'default';
}

/** 判断每日考勤明细是否符合筛选条件 */
export function isDailyDetailVisible(
  item: HrmAttendanceStatisticsApi.DailyDetail,
  filter: DailyStatusFilter,
) {
  switch (filter) {
    case 'absenteeism': {
      return item.absenteeism === true;
    }
    case 'attendance': {
      return (item.clockList?.length ?? 0) > 0;
    }
    case 'early': {
      return item.earlyCount > 0;
    }
    case 'late': {
      return item.lateCount > 0;
    }
    case 'misscard': {
      return (item.misscardCount || 0) > 0;
    }
    default: {
      return true;
    }
  }
}

/** 构建月度考勤日历格子 */
export function buildCalendarDays(
  yearMonth: string,
  dailyDetails: HrmAttendanceStatisticsApi.DailyDetail[] = [],
) {
  const dailyDetailMap = new Map(
    dailyDetails.map((item) => [
      formatDate(item.attendanceTime, 'YYYY-MM-DD'),
      item,
    ]),
  );
  const monthStart = dayjs(`${yearMonth}-01`);
  const mondayOffset = (monthStart.day() + 6) % 7;
  const calendarStart = monthStart.subtract(mondayOffset, 'day');
  return Array.from({ length: 42 }, (_, index) => {
    const date = calendarStart.add(index, 'day');
    const dateValue = formatDate(date, 'YYYY-MM-DD');
    return {
      date: dateValue,
      day: date.date(),
      currentMonth: formatDate(date, 'YYYY-MM') === yearMonth,
      detail: dailyDetailMap.get(dateValue),
    };
  });
}
