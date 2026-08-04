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

  /** 员工状态数量 */
  export interface StatusCount {
    status: number;
    count: number;
  }

  /** 员工部门统计 */
  export interface DeptStatistics {
    deptId: number;
    activeCount: number;
    fullTimeCount: number;
    nonFullTimeCount: number;
  }

  /** 员工再入职 */
  export interface RehireReq extends Employee {
    employeeId?: number;
  }

  /** 员工转正 */
  export interface RegularReq {
    employeeId?: number;
    reason?: number;
    newDeptId?: number;
    newPostName?: string;
    newPostLevel?: string;
    newWorkAddress?: string;
    newLeaderEmployeeId?: number;
    effectTime?: number;
    remark?: string;
  }

  /** 员工调岗 */
  export type TransferReq = RegularReq;

  /** 员工晋升 */
  export type PromoteReq = RegularReq;

  /** 员工降级 */
  export type DemoteReq = RegularReq;

  /** 员工转为全职 */
  export interface ConvertToFullTimeReq extends RegularReq {
    probation?: number;
  }

  /** 从后台用户批量创建员工 */
  export interface CreateFromUserReq {
    userId: number;
    jobNumber: string;
    mobile: string;
    deptId?: number;
    leaderEmployeeId?: number;
    type: number;
    status?: number;
    entryTime: number;
    probation?: number;
    postName?: string;
    postLevel?: string;
    workCity?: string;
    workAddress?: string;
    remark?: string;
  }

  /** 员工通知发送结果 */
  export interface NotifyResp {
    successCount: number;
    skippedCount: number;
    failureCount: number;
  }

  /** 员工导入结果 */
  export interface ImportResp {
    createJobNumbers: string[];
    updateJobNumbers: string[];
    skipJobNumbers: string[];
    failureJobNumbers: Record<string, string>;
  }

  /** 员工离职 */
  export interface QuitReq {
    employeeId?: number;
    planQuitTime?: number;
    applyQuitTime?: number;
    salarySettlementTime?: number;
    type?: number;
    reason?: number;
    remark?: string;
  }

  /** 取消员工离职 */
  export interface CancelQuitReq {
    employeeId: number;
    reason: string;
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

/** 查询员工状态数量 */
export function getEmployeeStatusCount(params: PageParam) {
  return requestClient.get<HrmEmployeeApi.StatusCount[]>(
    '/hrm/employee/status-count',
    { params },
  );
}

/** 查询员工部门统计 */
export function getEmployeeDeptStatistics() {
  return requestClient.get<HrmEmployeeApi.DeptStatistics[]>(
    '/hrm/employee/dept-statistics',
  );
}

/** 新增员工档案 */
export function createEmployee(data: HrmEmployeeApi.Employee) {
  return requestClient.post<number>('/hrm/employee/create', data);
}

/** 从未建档后台用户批量创建员工档案 */
export function createEmployeeList(data: HrmEmployeeApi.CreateFromUserReq[]) {
  return requestClient.post<number[]>('/hrm/employee/create-list', data);
}

/** 查询已经建立员工档案的后台用户编号 */
export function getBoundUserIdList() {
  return requestClient.get<number[]>('/hrm/employee/bound-user-id-list');
}

/** 发送填写员工档案通知 */
export function sendEmployeeProfileFillMessage(employeeIds: number[]) {
  return requestClient.post<HrmEmployeeApi.NotifyResp>(
    '/hrm/employee/send-profile-fill-message',
    null,
    { params: { ids: employeeIds.join(',') } },
  );
}

/** 修改员工档案 */
export function updateEmployee(data: HrmEmployeeApi.Employee) {
  return requestClient.put<boolean>('/hrm/employee/update', data);
}

/** 确认员工入职 */
export function confirmEmployeeEntry(data: HrmEmployeeApi.Employee) {
  return requestClient.put<boolean>('/hrm/employee/confirm-entry', data);
}

/** 办理员工再入职 */
export function rehireEmployee(data: HrmEmployeeApi.RehireReq) {
  return requestClient.post<boolean>('/hrm/employee/rehire', data);
}

/** 办理员工转正 */
export function regularEmployee(data: HrmEmployeeApi.RegularReq) {
  return requestClient.post<boolean>('/hrm/employee/regular', data);
}

/** 办理员工调岗 */
export function transferEmployee(data: HrmEmployeeApi.TransferReq) {
  return requestClient.post<boolean>('/hrm/employee/transfer', data);
}

/** 办理员工晋升 */
export function promoteEmployee(data: HrmEmployeeApi.PromoteReq) {
  return requestClient.post<boolean>('/hrm/employee/promote', data);
}

/** 办理员工降级 */
export function demoteEmployee(data: HrmEmployeeApi.DemoteReq) {
  return requestClient.post<boolean>('/hrm/employee/demote', data);
}

/** 办理员工转为全职 */
export function convertEmployeeToFullTime(
  data: HrmEmployeeApi.ConvertToFullTimeReq,
) {
  return requestClient.post<boolean>(
    '/hrm/employee/convert-to-full-time',
    data,
  );
}

/** 办理员工离职 */
export function quitEmployee(data: HrmEmployeeApi.QuitReq) {
  return requestClient.post<boolean>('/hrm/employee/quit', data);
}

/** 取消员工离职 */
export function cancelEmployeeQuit(data: HrmEmployeeApi.CancelQuitReq) {
  return requestClient.put<boolean>('/hrm/employee/cancel-quit', data);
}

/** 删除员工档案 */
export function deleteEmployee(id: number) {
  return requestClient.delete<boolean>(`/hrm/employee/delete?id=${id}`);
}

/** 批量删除员工档案 */
export function deleteEmployeeList(ids: number[]) {
  return requestClient.delete<boolean>('/hrm/employee/delete-list', {
    params: { ids: ids.join(',') },
  });
}

/** 导出员工档案 */
export function exportEmployee(params: PageParam) {
  return requestClient.download('/hrm/employee/export-excel', { params });
}

/** 下载员工档案导入模板 */
export function importEmployeeTemplate() {
  return requestClient.download('/hrm/employee/get-import-template');
}

/** 导入员工档案 */
export function importEmployee(file: File, duplicateStrategy: number) {
  return requestClient.upload<HrmEmployeeApi.ImportResp>(
    '/hrm/employee/import',
    { file, duplicateStrategy },
  );
}
