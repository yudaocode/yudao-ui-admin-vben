import { requestClient } from '#/api/request';

export namespace HrmEmployeeChangeRecordApi {
  export interface ChangeRecord {
    id?: number;
    employeeId?: number;
    type?: number;
    reason?: number;
    oldDeptId?: number;
    oldDeptName?: string;
    newDeptId?: number;
    newDeptName?: string;
    oldPostName?: string;
    newPostName?: string;
    oldPostLevel?: string;
    newPostLevel?: string;
    oldWorkAddress?: string;
    newWorkAddress?: string;
    oldLeaderEmployeeId?: number;
    oldLeaderEmployeeName?: string;
    newLeaderEmployeeId?: number;
    newLeaderEmployeeName?: string;
    probation?: number;
    effectTime?: number;
    remark?: string;
    createTime?: Date;
  }
}

export function getEmployeeChangeRecordList(employeeId: number) {
  return requestClient.get<HrmEmployeeChangeRecordApi.ChangeRecord[]>(
    '/hrm/employee/change-record/list',
    { params: { employeeId } },
  );
}
