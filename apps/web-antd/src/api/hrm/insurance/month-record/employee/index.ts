import type { PageParam, PageResult } from '@vben/request';

import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { requestClient } from '#/api/request';

export namespace HrmInsuranceMonthEmployeeRecordApi {
  /** 社保项目 */
  export interface Project {
    schemeProjectId?: number;
    type?: number;
    name?: string;
    baseAmount?: number;
    corporateRate?: number;
    personalRate?: number;
    corporateAmount?: number;
    personalAmount?: number;
  }

  /** 社保员工月度记录 */
  export interface InsuranceMonthEmployeeRecord {
    id?: number;
    monthRecordId?: number;
    employeeId?: number;
    employeeName?: string;
    jobNumber?: string;
    sex?: number;
    age?: number;
    mobile?: string;
    idNumber?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    entryStatus?: number;
    employeeStatus?: number;
    entryTime?: Date;
    schemeId?: number;
    schemeName?: string;
    areaId?: number;
    areaName?: string;
    houseType?: string;
    schemeType?: number;
    socialSecurityNumber?: string;
    accumulationFundNumber?: string;
    year?: number;
    month?: number;
    personalInsuranceAmount?: number;
    personalProvidentFundAmount?: number;
    corporateInsuranceAmount?: number;
    corporateProvidentFundAmount?: number;
    status?: number;
    socialSecurityProjectList: Project[];
    providentFundProjectList: Project[];
    createTime?: Date;
  }

  /** ProjectUpdateReq */
  export interface ProjectUpdateReq {
    schemeProjectId: number;
    baseAmount?: number;
    corporateAmount?: number;
    personalAmount?: number;
  }

  /** 修改请求 */
  export interface UpdateReq {
    id: number;
    schemeId: number;
    projects: ProjectUpdateReq[];
  }

  /** StopListReq */
  export interface StopListReq {
    ids: number[];
  }

  /** CreateListReq */
  export interface CreateListReq {
    monthRecordId: number;
    employeeIds: number[];
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
