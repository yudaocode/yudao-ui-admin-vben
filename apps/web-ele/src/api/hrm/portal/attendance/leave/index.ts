import type { HrmAttendanceLeaveApi } from '#/api/hrm/attendance/leave';

import { requestClient } from '#/api/request';

export type { HrmAttendanceLeaveApi };

export namespace HrmPortalAttendanceLeaveApi {
  /** 请假创建 */
  export interface LeaveCreate {
    type?: string; // 请假类型
    startTime?: number; // 请假开始时间
    endTime?: number; // 请假结束时间
    day?: number; // 请假天数
    reason?: string; // 请假事由
    remark?: string; // 备注
  }
}

/** 获得我的请假申请列表 */
export function getMyAttendanceLeaveList() {
  return requestClient.get<HrmAttendanceLeaveApi.AttendanceLeave[]>(
    '/hrm/portal/attendance/leave/list',
  );
}

/** 创建我的请假申请 */
export function createMyAttendanceLeave(
  data: HrmPortalAttendanceLeaveApi.LeaveCreate,
) {
  return requestClient.post<number>(
    '/hrm/portal/attendance/leave/create',
    data,
  );
}

/** 取消我的请假申请 */
export function cancelMyAttendanceLeave(id: number, reason: string) {
  return requestClient.put<boolean>('/hrm/portal/attendance/leave/cancel', {
    id,
    reason,
  });
}
