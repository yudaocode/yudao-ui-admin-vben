import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmSalaryMonthEmployeeRecordApi {
  /** 工资项值 */
  export interface OptionValue {
    code?: number; // 编码
    name?: string; // 薪资项名称
    value?: number; // 值
  }

  /** 员工月度工资记录 */
  export interface SalaryMonthEmployeeRecord {
    id?: number; // 编号
    monthRecordId?: number; // 工资表编号
    employeeId?: number; // 员工编号
    year?: number; // 年份
    month?: number; // 月份
    employeeName?: string; // 员工姓名
    jobNumber?: string; // 工号
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    postName?: string; // 职位名称
    actualWorkDay?: number; // 计薪出勤天数
    needWorkDay?: number; // 应出勤天数
    expectedPaySalary?: number; // 应发工资
    taxableSalary?: number; // 应税工资
    personalTax?: number; // 个人所得税
    realPaySalary?: number; // 实发工资
    performanceCoefficient?: number; // 绩效系数
    optionValues?: OptionValue[]; // 薪资项值列表
  }

  /** 绩效系数查询 */
  export interface PerformanceCoefficientReq {
    year: number; // 年份
    month: number; // 月份
    employeeIds?: number[]; // 员工编号列表
  }

  /** 员工月度工资列表查询 */
  export interface ListQuery {
    monthRecordId: number; // 工资表编号
    employeeId?: number; // 员工编号
    employeeIds?: number[]; // 员工编号列表
    employeeName?: string; // 员工姓名
    jobNumber?: string; // 工号
    deptId?: number; // 部门编号
    employeeChangeType?: number; // 员工异动类型
    salarySlipSent?: boolean;
  }
}

/** 批量修改员工月度工资 */
export function updateSalaryMonthEmployeeRecordList(
  data: HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord[],
) {
  return requestClient.put<boolean>(
    '/hrm/salary/month-employee-record/update-list',
    data,
  );
}

/** 获得员工月度工资分页 */
export function getSalaryMonthEmployeeRecordPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord>
  >('/hrm/salary/month-employee-record/page', { params });
}

/** 获得指定员工的月度工资分页 */
export function getSalaryEmployeeMonthRecordPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord>
  >('/hrm/salary/month-employee-record/employee-page', { params });
}

/** 获得员工月度工资列表 */
export function getSalaryMonthEmployeeRecordList(
  params: HrmSalaryMonthEmployeeRecordApi.ListQuery,
) {
  return requestClient.get<
    HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord[]
  >('/hrm/salary/month-employee-record/list', { params });
}

/** 获得月度工资员工变动数量 */
export function getSalaryMonthEmployeeChangeCount(params: PageParam) {
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
