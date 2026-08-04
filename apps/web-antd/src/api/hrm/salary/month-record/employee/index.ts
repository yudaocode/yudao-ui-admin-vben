import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmSalaryMonthEmployeeRecordApi {
  /** 工资项值 */
  export interface OptionValue {
    code?: number;
    name?: string;
    value?: number;
  }

  /** 员工月度工资记录 */
  export interface MonthRecord {
    id?: number;
    monthRecordId?: number;
    employeeId?: number;
    year?: number;
    month?: number;
    employeeName?: string;
    jobNumber?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    actualWorkDay?: number;
    needWorkDay?: number;
    expectedPaySalary?: number;
    taxableSalary?: number;
    personalTax?: number;
    realPaySalary?: number;
    performanceCoefficient?: number;
    optionValues?: OptionValue[];
  }

  /** 绩效系数查询 */
  export interface PerformanceCoefficientReq {
    year: number;
    month: number;
    employeeIds?: number[];
  }

  /** 员工月度工资列表查询 */
  export interface ListQuery {
    monthRecordId: number;
    employeeId?: number;
    employeeIds?: number[];
    employeeName?: string;
    jobNumber?: string;
    deptId?: number;
    employeeChangeType?: number;
    salarySlipSent?: boolean;
  }
}

/** 批量修改员工月度工资 */
export function updateSalaryMonthEmployeeRecordList(
  data: HrmSalaryMonthEmployeeRecordApi.MonthRecord[],
) {
  return requestClient.put<boolean>(
    '/hrm/salary/month-employee-record/update-list',
    data,
  );
}

/** 获得员工月度工资分页 */
export function getSalaryMonthEmployeeRecordPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmSalaryMonthEmployeeRecordApi.MonthRecord>
  >('/hrm/salary/month-employee-record/page', { params });
}

/** 获得指定员工的月度工资分页 */
export function getSalaryEmployeeMonthRecordPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmSalaryMonthEmployeeRecordApi.MonthRecord>
  >('/hrm/salary/month-employee-record/employee-page', { params });
}

/** 获得员工月度工资列表 */
export function getSalaryMonthEmployeeRecordList(
  params: HrmSalaryMonthEmployeeRecordApi.ListQuery,
) {
  return requestClient.get<HrmSalaryMonthEmployeeRecordApi.MonthRecord[]>(
    '/hrm/salary/month-employee-record/list',
    { params },
  );
}

/** 获得月度工资员工变动数量 */
export function getSalaryMonthEmployeeChangeCount(
  params: HrmSalaryMonthEmployeeRecordApi.ListQuery & Partial<PageParam>,
) {
  return requestClient.get<Record<number, number>>(
    '/hrm/salary/month-employee-record/change-count',
    { params },
  );
}

/** 获得绩效系数列表 */
export function getSalaryPerformanceCoefficients(
  data: HrmSalaryMonthEmployeeRecordApi.PerformanceCoefficientReq,
) {
  return requestClient.post<Record<number, number>>(
    '/hrm/salary/month-employee-record/performance-coefficients',
    data,
  );
}
