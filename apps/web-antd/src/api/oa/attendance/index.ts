import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaAttendanceApi {
  /** OA 考勤记录 */
  export interface Attendance {
    id?: number; // 考勤编号
    userId: number; // 用户编号
    userName?: string; // 用户名称
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    type: number; // 考勤类型
    status: number; // 考勤状态
    attendanceTime: string; // 考勤时间
    attendanceIp?: string; // 考勤 IP
    remark?: string; // 备注
    createTime?: string; // 创建时间
  }

  /** OA 考勤周报 */
  export interface AttendanceWeekReport {
    userId: number; // 用户编号
    userName?: string; // 用户名称
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    dailyAttendances: {
      clockInId?: number; // 上班考勤记录编号
      clockInStatus?: number; // 上班打卡状态
      clockInTime?: string; // 上班打卡时间
      clockOutId?: number; // 下班考勤记录编号
      clockOutStatus?: number; // 下班打卡状态
      clockOutTime?: string; // 下班打卡时间
      date: string; // 日期
    }[]; // 每日考勤列表
  }

  /** OA 考勤月报 */
  export interface AttendanceMonthReport {
    userId: number; // 用户编号
    userName?: string; // 用户名称
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    clockInCount: number; // 上班打卡次数
    clockOutCount: number; // 下班打卡次数
    normalCount: number; // 正常次数
    lateCount: number; // 迟到次数
    earlyCount: number; // 早退次数
    leaveDays: number; // 请假天数
    travelDays: number; // 出差天数
    absentDays: number; // 旷工天数
  }
}

/** 查询考勤记录分页 */
export function getAttendancePage(params: PageParam) {
  return requestClient.get<PageResult<OaAttendanceApi.Attendance>>(
    '/oa/attendance/page',
    { params },
  );
}

/** 查询我的考勤记录分页 */
export function getMyAttendancePage(params: PageParam) {
  return requestClient.get<PageResult<OaAttendanceApi.Attendance>>(
    '/oa/attendance/my-page',
    { params },
  );
}

/** 查询考勤记录详情 */
export function getAttendance(id: number) {
  return requestClient.get<OaAttendanceApi.Attendance>('/oa/attendance/get', {
    params: { id },
  });
}

/** 查询我的今日考勤记录 */
export function getMyTodayAttendanceList() {
  return requestClient.get<OaAttendanceApi.Attendance[]>(
    '/oa/attendance/my-today-list',
  );
}

/** 执行当前用户打卡 */
export function clockAttendance() {
  return requestClient.post<boolean>('/oa/attendance/clock');
}

/** 修改考勤记录 */
export function updateAttendance(data: Partial<OaAttendanceApi.Attendance>) {
  return requestClient.put<boolean>('/oa/attendance/update', data);
}

/** 删除考勤记录 */
export function deleteAttendance(id: number) {
  return requestClient.delete<boolean>('/oa/attendance/delete', {
    params: { id },
  });
}

/** 查询考勤周报 */
export function getAttendanceWeekReport(params: {
  startDate: string; // 周开始日期
  userId?: number; // 用户编号
}) {
  return requestClient.get<OaAttendanceApi.AttendanceWeekReport[]>(
    '/oa/attendance/week-report',
    { params },
  );
}

/** 查询考勤月报 */
export function getAttendanceMonthReport(params: {
  month: number; // 月份
  userId?: number; // 用户编号
  year: number; // 年份
}) {
  return requestClient.get<OaAttendanceApi.AttendanceMonthReport[]>(
    '/oa/attendance/month-report',
    { params },
  );
}
