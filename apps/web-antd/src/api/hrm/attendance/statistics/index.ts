import type { PageParam, PageResult } from '@vben/request';

import type { HrmAttendanceClockApi } from '#/api/hrm/attendance/clock';
import type { HrmAttendanceLeaveApi } from '#/api/hrm/attendance/leave';

import { requestClient } from '#/api/request';

export namespace HrmAttendanceStatisticsApi {
  /** 每日打卡概况展示项 */
  export interface DailyOverviewItem {
    type?: string;
    time?: string;
    status?: string;
    text?: string;
  }

  /** 每日打卡概况 */
  export interface DailyOverview {
    clocks: HrmAttendanceClockApi.Clock[];
    attendanceResult?: string;
    overviews: DailyOverviewItem[];
  }

  /** 月度每日考勤概览 */
  export interface MonthDailyOverview {
    employeeId: number;
    employeeName: string;
    jobNumber?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    year: number;
    month: number;
    dailyClockMap: Record<string, DailyOverview>;
  }

  /** 每日考勤明细 */
  export interface DailyDetail {
    employeeId: number;
    employeeName?: string;
    jobNumber?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    attendanceTime: Date;
    shiftName?: string;
    scheduled?: boolean;
    requiredClockCount?: number;
    scheduledMinutes?: number;
    misscardCount?: number;
    absenteeism?: boolean;
    absenteeismMinutes?: number;
    absenteeismDays?: number;
    leaveStatus?: boolean;
    leaveMinutes?: number;
    leaveDays?: number;
    attendanceResult?: string;
    lateCount: number;
    lateMinutes?: number;
    earlyCount: number;
    earlyMinutes?: number;
    clockList: HrmAttendanceClockApi.Clock[];
  }

  /** 月度考勤汇总 */
  export interface MonthRecord {
    employeeId: number;
    employeeName: string;
    jobNumber?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    attendanceGroupName?: string;
    entryTime?: Date;
    employeeStatus?: number;
    workCity?: string;
    year: number;
    month: number;
    attendDays: number;
    actualDays: number;
    lateMinute: number;
    lateCount: number;
    earlyMinute: number;
    earlyCount: number;
    misscardCount: number;
    absenteeismDays: number;
    absenteeismMinutes: number;
    leaveDays: number;
    leaveMinutes: number;
    lateDeductAmount: number;
    earlyDeductAmount: number;
    misscardDeductAmount: number;
    absenteeismDeductAmount: number;
    attendanceDeductAmount: number;
    fullAttendance: boolean;
  }

  /** 月度考勤详情 */
  export interface MonthDetail {
    summary: MonthRecord;
    dailyDetails: DailyDetail[];
    leaves: HrmAttendanceLeaveApi.Leave[];
  }
}

/** 获得月度考勤汇总分页 */
export function getAttendanceMonthRecordPage(
  params: PageParam & { month: number; year: number },
) {
  return requestClient.get<PageResult<HrmAttendanceStatisticsApi.MonthRecord>>(
    '/hrm/attendance/statistics/month-record-page',
    { params },
  );
}

/** 获得月度考勤详情 */
export function getAttendanceMonthDetail(params: {
  employeeId: number;
  month: number;
  year: number;
}) {
  return requestClient.get<HrmAttendanceStatisticsApi.MonthDetail>(
    '/hrm/attendance/statistics/month-detail',
    { params },
  );
}

/** 导出月度考勤汇总 */
export function exportAttendanceMonthRecord(
  params: PageParam & { month: number; year: number },
) {
  return requestClient.download(
    '/hrm/attendance/statistics/month-record-export-excel',
    { params },
  );
}

/** 获得月度打卡概况分页 */
export function getAttendanceMonthDailyOverviewPage(
  params: PageParam & { month: number; year: number },
) {
  return requestClient.get<
    PageResult<HrmAttendanceStatisticsApi.MonthDailyOverview>
  >('/hrm/attendance/statistics/month-daily-page', { params });
}

/** 获得每日考勤明细 */
export function getAttendanceDailyDetail(params: {
  attendanceTime: string;
  employeeId: number;
}) {
  return requestClient.get<HrmAttendanceStatisticsApi.DailyDetail>(
    '/hrm/attendance/statistics/daily-detail',
    { params },
  );
}

/** 导出月度打卡概况 */
export function exportAttendanceMonthDailyOverview(
  params: PageParam & { month: number; year: number },
) {
  return requestClient.download(
    '/hrm/attendance/statistics/month-daily-export-excel',
    { params },
  );
}
