import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmAttendanceClockApi {
  /** 考勤打卡 */
  export interface Clock {
    id?: number;
    employeeId?: number;
    clockTime?: Date | number;
    type: number;
    attendanceTime?: Date | number;
    sourceType?: number;
    status?: number;
    stage?: number;
    address?: string;
    longitude?: number;
    latitude?: number;
    ssid?: string;
    mac?: string;
    remark?: string;
    employeeName?: string;
    jobNumber?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    createTime?: Date;
  }

  /** 员工实际班次 */
  export interface Shift {
    startTime: Date;
    endTime: Date;
    clockInStartTime: Date;
    clockInEndTime: Date;
    clockOutStartTime: Date;
    clockOutEndTime: Date;
  }
}

/** 获得考勤打卡分页 */
export function getAttendanceClockPage(params: PageParam) {
  return requestClient.get<PageResult<HrmAttendanceClockApi.Clock>>(
    '/hrm/attendance/clock/page',
    { params },
  );
}

/** 获得考勤打卡详情 */
export function getAttendanceClock(id: number) {
  return requestClient.get<HrmAttendanceClockApi.Clock>(
    `/hrm/attendance/clock/get?id=${id}`,
  );
}

/** 获得员工实际班次和允许打卡时间 */
export function getAttendanceClockShift(params: {
  attendanceTime: string;
  employeeId: number;
}) {
  return requestClient.get<HrmAttendanceClockApi.Shift | undefined>(
    '/hrm/attendance/clock/get-shift',
    { params },
  );
}

/** 导出考勤打卡 */
export function exportAttendanceClock(params: PageParam) {
  return requestClient.download('/hrm/attendance/clock/export-excel', {
    params,
  });
}

/** 新增考勤打卡 */
export function createAttendanceClock(data: HrmAttendanceClockApi.Clock) {
  return requestClient.post<number>('/hrm/attendance/clock/create', data);
}

/** 修改考勤打卡 */
export function updateAttendanceClock(data: HrmAttendanceClockApi.Clock) {
  return requestClient.put<boolean>('/hrm/attendance/clock/update', data);
}

/** 删除考勤打卡 */
export function deleteAttendanceClock(id: number) {
  return requestClient.delete<boolean>(`/hrm/attendance/clock/delete?id=${id}`);
}

/** 批量删除考勤打卡 */
export function deleteAttendanceClockList(ids: number[]) {
  return requestClient.delete<boolean>('/hrm/attendance/clock/delete-list', {
    params: { ids: ids.join(',') },
  });
}
