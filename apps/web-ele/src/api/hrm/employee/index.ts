import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmEmployeeApi {
  /** 员工档案 */
  export interface Employee {
    id?: number; // 员工编号
    name: string; // 员工姓名
    jobNumber?: string; // 工号
    userId?: number; // 后台用户编号
    userNickname?: string; // 后台用户昵称
    mobile?: string; // 手机号
    country?: string; // 国家或地区
    nation?: string; // 民族
    idType?: number; // 证件类型
    idNumber?: string; // 证件号码
    sex?: number; // 性别
    email?: string; // 邮箱
    nativePlace?: string; // 籍贯
    birthday?: number; // 出生时间
    age?: number; // 年龄
    address?: string; // 户籍地址
    highestEducation?: number; // 最高学历
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    leaderEmployeeId?: number; // 直属上级员工编号
    leaderEmployeeName?: string; // 直属上级员工姓名
    entryStatus?: number; // 入职状态
    status?: number; // 员工状态
    type?: number; // 聘用形式
    entryTime?: number; // 入职时间
    probation?: number; // 试用期，单位月
    regularTime?: number; // 转正时间
    leaveTime?: number; // 离职时间
    postName?: string; // 职位名称
    postLevel?: string; // 岗位职级
    workCity?: string; // 工作城市
    workAddress?: string; // 工作地点
    workDetailAddress?: string; // 工作详细地址
    channelId?: number; // 招聘渠道编号
    channelName?: string; // 招聘渠道名称
    companyAgeStartTime?: number; // 司龄开始时间
    companyAge?: number; // 司龄，单位年
    candidateId?: number; // 招聘候选人编号
    salaryCardNumber?: string; // 银行卡号
    salaryCardAreaId?: number; // 开户地区编号
    salaryCardAreaName?: string; // 开户地区名称
    salaryCardBankName?: string; // 银行名称
    salaryCardBankBranchName?: string; // 开户支行名称
    socialSecurityNumber?: string; // 个人社保账号
    accumulationFundNumber?: string; // 个人公积金账号
    remark?: string; // 备注
    createTime?: number; // 创建时间
  }

  /** 员工状态数量 */
  export interface StatusCount {
    status: number; // 候选人状态
    count: number; // 候选人数量
  }

  /** 员工部门统计 */
  export interface DeptStatistics {
    deptId: number; // 部门编号
    activeCount: number; // 在职员工人数
    fullTimeCount: number; // 全职员工人数
    nonFullTimeCount: number; // 非全职员工人数
  }

  /** 员工再入职 */
  export interface RehireReq extends Employee {
    employeeId?: number;
  }

  /** 员工转正 */
  export interface RegularReq {
    employeeId?: number; // 员工编号
    reason?: number; // 异动原因
    newDeptId?: number; // 新部门编号；未填写表示不变
    newPostName?: string; // 新岗位名称；未填写表示不变
    newPostLevel?: string; // 新职级；未填写表示不变
    newWorkAddress?: string; // 新工作地点；未填写表示不变
    newLeaderEmployeeId?: number; // 新直属上级员工编号；未填写表示不变
    effectTime?: number; // 生效时间
    remark?: string; // 备注
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
    userId: number; // 后台用户编号
    jobNumber: string; // 工号
    mobile: string; // 员工手机号
    deptId?: number; // 部门编号
    leaderEmployeeId?: number; // 直属上级员工编号
    type: number; // 聘用形式
    status?: number; // 非正式员工状态
    entryTime: number; // 入职时间
    probation?: number; // 试用期，单位月
    postName?: string; // 职位名称
    postLevel?: string; // 岗位职级
    workCity?: string; // 工作城市
    workAddress?: string; // 工作地点
    remark?: string; // 备注
  }

  /** 员工通知发送结果 */
  export interface NotifyResp {
    successCount: number; // 发送成功数量
    skippedCount: number; // 无后台账号跳过数量
    failureCount: number; // 发送失败数量
  }

  /** 员工导入结果 */
  export interface ImportResp {
    createJobNumbers: string[]; // 新增成功的工号
    updateJobNumbers: string[]; // 更新成功的工号
    skipJobNumbers: string[]; // 跳过的工号
    failureJobNumbers: Record<string, string>; // 导入失败的工号及原因
  }

  /** 员工离职 */
  export interface QuitReq {
    employeeId?: number; // 员工编号
    planQuitTime?: number; // 计划离职时间
    applyQuitTime?: number; // 申请离职时间
    salarySettlementTime?: number; // 薪资结算时间
    type?: number; // 离职类型
    reason?: number; // 离职原因
    remark?: string; // 备注
  }

  /** 取消员工离职 */
  export interface CancelQuitReq {
    employeeId: number; // 员工编号
    reason: string; // 取消原因
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

/** 查询指定员工精简精简列表 */
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
