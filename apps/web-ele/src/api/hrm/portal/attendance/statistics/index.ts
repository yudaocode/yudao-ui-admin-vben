import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { requestClient } from '#/api/request';

export type AttendanceMonthDetail = HrmAttendanceStatisticsApi.MonthDetail;

/** 获得我的月度考勤详情 */
export function getAttendanceMonthDetail(year?: number, month?: number) {
  return requestClient.get<AttendanceMonthDetail>(
    '/hrm/portal/attendance/statistics/month-detail',
    { params: { year, month } },
  );
}

/** 导出我的月度考勤 */
export function exportAttendanceMonthDetail(year: number, month: number) {
  return requestClient.download(
    '/hrm/portal/attendance/statistics/export-excel',
    { params: { year, month } },
  );
}
