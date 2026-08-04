import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmAttendanceLeaveApi {
  /** 考勤请假 */
  export interface AttendanceLeave {
    id?: number; // 请假记录编号
    employeeId?: number; // 员工编号
    employeeName?: string; // 员工姓名
    jobNumber?: string; // 工号
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    postName?: string; // 职位名称
    type: string; // 请假类型
    startTime?: Date; // 请假开始时间
    endTime?: Date; // 请假结束时间
    day: number; // 请假天数
    reason?: string; // 请假事由
    remark?: string; // 备注
    approvalStatus?: number; // 审批状态
    processInstanceId?: string; // 流程实例编号
    approvalTime?: Date; // 审批时间
    approvalReason?: string; // 审批意见
    createTime?: Date; // 创建时间
  }
}

/** 获得请假分页 */
export function getAttendanceLeavePage(params: PageParam) {
  return requestClient.get<PageResult<HrmAttendanceLeaveApi.AttendanceLeave>>(
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
  return requestClient.get<HrmAttendanceLeaveApi.AttendanceLeave>(
    `/hrm/attendance/leave/get?id=${id}`,
  );
}
