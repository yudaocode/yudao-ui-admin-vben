import { requestClient } from '#/api/request';

export namespace HrmPortalEmployeeApi {
  export interface Employee {
    id: number;
    name?: string;
    avatar?: string;
    jobNumber?: string;
    mobile?: string;
    country?: string;
    nation?: string;
    idType?: number;
    idNumber?: string;
    sex?: number;
    email?: string;
    nativePlace?: string;
    birthday?: number;
    age?: number;
    address?: string;
    highestEducation?: number;
    deptId?: number;
    deptName?: string;
    leaderEmployeeId?: number;
    leaderEmployeeName?: string;
    entryStatus?: number;
    status?: number;
    type?: number;
    entryTime?: Date | number;
    entryDay: number;
    probation?: number;
    regularTime?: Date | number;
    leaveTime?: Date | number;
    postName?: string;
    postLevel?: string;
    workCity?: string;
    workAddress?: string;
    workDetailAddress?: string;
    companyAgeStartTime?: Date | number;
    companyAge?: number;
  }

  export interface EmployeeUpdateReq {
    name?: string;
    mobile?: string;
    country?: string;
    nation?: string;
    idType?: number;
    idNumber?: string;
    sex?: number;
    email?: string;
    nativePlace?: string;
    birthday?: number;
    address?: string;
    highestEducation?: number;
  }
}

/** 获得当前账号的员工绑定状态 */
export function getEmployeeBindStatus() {
  return requestClient.get<boolean>('/hrm/portal/employee/get-bind-status');
}

/** 获得当前员工档案 */
export function getEmployee() {
  return requestClient.get<HrmPortalEmployeeApi.Employee>(
    '/hrm/portal/employee/get',
  );
}

/** 修改当前员工档案 */
export function updateEmployee(data: HrmPortalEmployeeApi.EmployeeUpdateReq) {
  return requestClient.put<boolean>('/hrm/portal/employee/update', data);
}
