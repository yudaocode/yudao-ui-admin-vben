import type { PageParam, PageResult } from '@vben/request';

import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { requestClient } from '#/api/request';

export namespace HrmInsuranceMonthEmployeeRecordApi {
  /** 社保项目 */
  export interface Project {
    schemeProjectId?: number; // 社保项目编号
    type?: number; // 项目类型
    name?: string; // 项目名称
    baseAmount?: number; // 缴纳基数
    corporateRate?: number; // 公司缴纳比例
    personalRate?: number; // 个人缴纳比例
    corporateAmount?: number; // 公司缴纳金额
    personalAmount?: number; // 个人缴纳金额
  }

  /** 社保员工月度记录 */
  export interface InsuranceMonthEmployeeRecord {
    id?: number; // 编号
    monthRecordId?: number; // 工资表编号
    employeeId?: number; // 员工编号
    employeeName?: string; // 员工姓名
    jobNumber?: string; // 工号
    sex?: number; // 性别
    age?: number; // 年龄
    mobile?: string; // 手机号
    idNumber?: string; // 证件号码
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    postName?: string; // 职位名称
    entryStatus?: number; // 入职状态
    employeeStatus?: number; // 员工状态
    entryTime?: Date; // 入职时间
    schemeId?: number; // 社保方案编号
    schemeName?: string; // 社保方案名称
    areaId?: number; // 参保地区编号
    areaName?: string; // 参保地区
    houseType?: string; // 户籍类型
    schemeType?: number; // 社保方案类型
    socialSecurityNumber?: string; // 个人社保账号
    accumulationFundNumber?: string; // 个人公积金账号
    year?: number; // 年份
    month?: number; // 月份
    personalInsuranceAmount?: number; // 个人社保金额
    personalProvidentFundAmount?: number; // 个人公积金金额
    corporateInsuranceAmount?: number; // 公司社保金额
    corporateProvidentFundAmount?: number; // 公司公积金金额
    status?: number; // 参保状态
    socialSecurityProjectList: Project[]; // 社保项目
    providentFundProjectList: Project[]; // 公积金项目
    createTime?: Date; // 创建时间
  }

  /** ProjectUpdateReq */
  export interface ProjectUpdateReq {
    schemeProjectId: number; // 社保项目编号
    baseAmount?: number; // 缴纳基数
    corporateAmount?: number; // 公司缴纳金额
    personalAmount?: number; // 个人缴纳金额
  }

  /** 修改请求 */
  export interface UpdateReq {
    id: number; // 编号
    schemeId: number; // 社保方案编号
    projects: ProjectUpdateReq[]; // 社保项目列表
  }

  /** StopListReq */
  export interface StopListReq {
    ids: number[]; // 员工编号列表
  }

  /** CreateListReq */
  export interface CreateListReq {
    monthRecordId: number; // 工资表编号
    employeeIds: number[]; // 员工编号列表
  }
}

/** 查询社保员工月度记录分页 */
export function getInsuranceMonthEmployeeRecordPage(params: PageParam) {
  return requestClient.get<
    PageResult<
      HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord[]
    >
  >('/hrm/insurance/month-employee-record/page', { params });
}

/** 查询社保员工月度记录 */
export function getInsuranceMonthEmployeeRecord(id: number) {
  return requestClient.get<HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord>(
    '/hrm/insurance/month-employee-record/get',
    { params: { id } },
  );
}

/** 修改社保员工月度记录 */
export function updateInsuranceMonthEmployeeRecord(
  data: HrmInsuranceMonthEmployeeRecordApi.UpdateReq,
) {
  return requestClient.put<boolean>(
    '/hrm/insurance/month-employee-record/update',
    data,
  );
}

/** stopInsuranceMonthEmployeeRecordList */
export function stopInsuranceMonthEmployeeRecordList(
  data: HrmInsuranceMonthEmployeeRecordApi.StopListReq,
) {
  return requestClient.put<boolean>(
    '/hrm/insurance/month-employee-record/stop-list',
    data,
  );
}

/** 新增社保员工月度记录 */
export function createInsuranceMonthEmployeeRecordList(
  data: HrmInsuranceMonthEmployeeRecordApi.CreateListReq,
) {
  return requestClient.post<boolean>(
    '/hrm/insurance/month-employee-record/create-list',
    data,
  );
}

/** 查询员工档案列表 */
export function getUninsuredEmployeeList(monthRecordId: number) {
  return requestClient.get<HrmEmployeeApi.Employee[]>(
    '/hrm/insurance/month-employee-record/uninsured-employee-list',
    { params: { monthRecordId } },
  );
}
