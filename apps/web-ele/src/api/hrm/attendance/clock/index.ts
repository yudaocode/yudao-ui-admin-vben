import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmAttendanceClockApi {
  /** 考勤打卡 */
  export interface AttendanceClock {
    id?: number; // 打卡记录编号
    employeeId?: number; // 打卡员工编号
    clockTime?: Date | number; // 打卡时间
    type: number; // 打卡类型
    attendanceTime?: Date | number; // 应打卡时间
    sourceType?: number; // 打卡来源
    status?: number; // 打卡状态
    stage?: number; // 打卡阶段
    address?: string; // 打卡地址
    longitude?: number; // 经度
    latitude?: number; // 纬度
    ssid?: string; // WiFi 名称
    mac?: string; // WiFi MAC 地址
    remark?: string; // 备注
    employeeName?: string; // 员工姓名
    jobNumber?: string; // 工号
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    postName?: string; // 职位名称
    createTime?: Date; // 创建时间
  }

  /** 员工实际班次 */
  export interface Shift {
    startTime: Date; // 上班时间
    endTime: Date; // 下班时间
    clockInStartTime: Date; // 上班打卡开始时间
    clockInEndTime: Date; // 上班打卡结束时间
    clockOutStartTime: Date; // 下班打卡开始时间
    clockOutEndTime: Date; // 下班打卡结束时间
  }
}

/** 获得考勤打卡分页 */
export function getAttendanceClockPage(params: PageParam) {
  return requestClient.get<PageResult<HrmAttendanceClockApi.AttendanceClock>>(
    '/hrm/attendance/clock/page',
    { params },
  );
}

/** 获得考勤打卡详情 */
export function getAttendanceClock(id: number) {
  return requestClient.get<HrmAttendanceClockApi.AttendanceClock>(
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
export function createAttendanceClock(
  data: HrmAttendanceClockApi.AttendanceClock,
) {
  return requestClient.post<number>('/hrm/attendance/clock/create', data);
}

/** 修改考勤打卡 */
export function updateAttendanceClock(
  data: HrmAttendanceClockApi.AttendanceClock,
) {
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
