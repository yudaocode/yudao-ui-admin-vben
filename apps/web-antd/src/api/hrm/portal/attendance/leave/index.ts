import type { HrmAttendanceLeaveApi } from '#/api/hrm/attendance/leave';

import { requestClient } from '#/api/request';

export type { HrmAttendanceLeaveApi };

export namespace HrmPortalAttendanceLeaveApi {
  export interface LeaveCreate {
    type?: string;
    startTime?: number;
    endTime?: number;
    day?: number;
    reason?: string;
    remark?: string;
  }
}

/** 获得我的请假申请列表 */
export function getMyAttendanceLeaveList() {
  return requestClient.get<HrmAttendanceLeaveApi.Leave[]>(
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
