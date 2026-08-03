import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmEmployeeApi {
  /** 员工档案 */
  export interface Employee {
    id?: number;
    name: string;
    jobNumber?: string;
    userId?: number;
    userNickname?: string;
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
    entryTime?: number;
    probation?: number;
    regularTime?: number;
    leaveTime?: number;
    postName?: string;
    postLevel?: string;
    workCity?: string;
    workAddress?: string;
    workDetailAddress?: string;
    channelId?: number;
    channelName?: string;
    companyAgeStartTime?: number;
    companyAge?: number;
    candidateId?: number;
    salaryCardNumber?: string;
    salaryCardAreaId?: number;
    salaryCardAreaName?: string;
    salaryCardBankName?: string;
    salaryCardBankBranchName?: string;
    socialSecurityNumber?: string;
    accumulationFundNumber?: string;
    remark?: string;
    createTime?: Date;
  }

  /** 员工部门统计 */
  export interface DeptStatistics {
    deptId: number;
    activeCount: number;
    fullTimeCount: number;
    nonFullTimeCount: number;
  }
}

/** 查询员工档案分页 */
export function getEmployeePage(params: PageParam) {
  return requestClient.get<PageResult<HrmEmployeeApi.Employee>>(
    '/hrm/employee/page',
    { params },
  );
}

/** 查询员工档案详情 */
export function getEmployee(id: number) {
  return requestClient.get<HrmEmployeeApi.Employee>(
    `/hrm/employee/get?id=${id}`,
  );
}

/** 查询指定员工列表 */
export function getEmployeeList(ids: number[]) {
  return requestClient.get<HrmEmployeeApi.Employee[]>('/hrm/employee/list', {
    params: { ids: ids.join(',') },
  });
}

/** 查询员工精简分页 */
export function getEmployeeSimplePage(params: PageParam) {
  return requestClient.get<PageResult<HrmEmployeeApi.Employee>>(
    '/hrm/employee/simple-page',
    { params },
  );
}

/** 查询指定员工精简列表 */
export function getEmployeeSimpleList(ids: number[]) {
  return requestClient.get<HrmEmployeeApi.Employee[]>(
    '/hrm/employee/simple-list',
    { params: { ids: ids.join(',') } },
  );
}

/** 查询员工部门统计 */
export function getEmployeeDeptStatistics() {
  return requestClient.get<HrmEmployeeApi.DeptStatistics[]>(
    '/hrm/employee/dept-statistics',
  );
}

/** 确认员工入职 */
export function confirmEmployeeEntry(data: HrmEmployeeApi.Employee) {
  return requestClient.put<boolean>('/hrm/employee/confirm-entry', data);
}
