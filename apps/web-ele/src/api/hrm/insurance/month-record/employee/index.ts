import type { PageParam, PageResult } from '@vben/request';

import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { requestClient } from '#/api/request';

export namespace HrmInsuranceMonthEmployeeRecordApi {
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

  export interface EmployeeRecord {
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

  export interface ProjectUpdateReq {
    schemeProjectId: number;
    baseAmount?: number;
    corporateAmount?: number;
    personalAmount?: number;
  }

  export interface UpdateReq {
    id: number;
    schemeId: number;
    projects: ProjectUpdateReq[];
  }

  export interface StopListReq {
    ids: number[];
  }

  export interface CreateListReq {
    monthRecordId: number;
    employeeIds: number[];
  }
}

export function getInsuranceMonthEmployeeRecordPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmInsuranceMonthEmployeeRecordApi.EmployeeRecord[]>
  >('/hrm/insurance/month-employee-record/page', { params });
}

export function getInsuranceMonthEmployeeRecord(id: number) {
  return requestClient.get<HrmInsuranceMonthEmployeeRecordApi.EmployeeRecord>(
    '/hrm/insurance/month-employee-record/get',
    { params: { id } },
  );
}

export function updateInsuranceMonthEmployeeRecord(
  data: HrmInsuranceMonthEmployeeRecordApi.UpdateReq,
) {
  return requestClient.put<boolean>(
    '/hrm/insurance/month-employee-record/update',
    data,
  );
}

export function stopInsuranceMonthEmployeeRecordList(
  data: HrmInsuranceMonthEmployeeRecordApi.StopListReq,
) {
  return requestClient.put<boolean>(
    '/hrm/insurance/month-employee-record/stop-list',
    data,
  );
}

export function createInsuranceMonthEmployeeRecordList(
  data: HrmInsuranceMonthEmployeeRecordApi.CreateListReq,
) {
  return requestClient.post<boolean>(
    '/hrm/insurance/month-employee-record/create-list',
    data,
  );
}

export function getUninsuredEmployeeList(monthRecordId: number) {
  return requestClient.get<HrmEmployeeApi.Employee[]>(
    '/hrm/insurance/month-employee-record/uninsured-employee-list',
    { params: { monthRecordId } },
  );
}
