import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmAttendanceLeaveApi {
  /** 考勤请假 */
  export interface Leave {
    id?: number;
    employeeId?: number;
    employeeName?: string;
    jobNumber?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    type: string;
    startTime?: Date;
    endTime?: Date;
    day: number;
    reason?: string;
    remark?: string;
    approvalStatus?: number;
    processInstanceId?: string;
    approvalTime?: Date;
    approvalReason?: string;
    createTime?: Date;
  }
}

/** 获得请假分页 */
export function getAttendanceLeavePage(params: PageParam) {
  return requestClient.get<PageResult<HrmAttendanceLeaveApi.Leave>>(
    '/hrm/attendance/leave/page',
    { params },
  );
}

/** 导出请假 */
export function exportAttendanceLeave(params: PageParam) {
  return requestClient.download('/hrm/attendance/leave/export-excel', {
    params,
  });
}

/** 获得请假详情 */
export function getAttendanceLeave(id: number) {
  return requestClient.get<HrmAttendanceLeaveApi.Leave>(
    `/hrm/attendance/leave/get?id=${id}`,
  );
}
