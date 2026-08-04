import type { PageParam, PageResult } from '@vben/request';

import type { HrmSalaryOptionApi } from '../config/option';

import { requestClient } from '#/api/request';

export namespace HrmSalaryMonthRecordApi {
  /** 月度工资表 */
  export interface SalaryMonthRecord {
    id?: number;
    title?: string;
    year?: number;
    month?: number;
    employeeCount?: number;
    startTime?: string;
    endTime?: string;
    expectedPaySalary?: number;
    personalInsuranceAmount?: number;
    personalProvidentFundAmount?: number;
    personalTax?: number;
    realPaySalary?: number;
    corporateInsuranceAmount?: number;
    corporateProvidentFundAmount?: number;
    status?: number;
    optionHeaders?: HrmSalaryOptionApi.SalaryOption[];
    createTime?: Date;
  }

  /** 薪资核算就绪员工 */
  export interface PayrollReadinessEmployee {
    employeeId?: number;
    employeeName?: string;
    jobNumber?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    entryStatus?: number;
    status?: number;
    entryTime?: Date;
  }

  /** 薪资核算就绪状态 */
  export interface PayrollReadiness {
    monthRecordId?: number;
    title?: string;
    year?: number;
    month?: number;
    startTime?: string;
    endTime?: string;
    socialSecurityYearMonth?: string;
    payrollEmployeeCount?: number;
    salaryEmployeeCount?: number;
    noSalaryEmployeeCount?: number;
    noSalaryGroupEmployeeCount?: number;
    changeEmployeeCount?: number;
    changeTypeCountMap?: Record<number, number>;
    noSalaryEmployees?: PayrollReadinessEmployee[];
    noSalaryGroupEmployees?: PayrollReadinessEmployee[];
  }
}

/** 创建下月工资表 */
export function createNextSalaryMonthRecord() {
  return requestClient.post<number>('/hrm/salary/month-record/create-next');
}

/** 导入并核算月度工资表 */
export function computeSalaryMonthRecordWithImport(data: FormData) {
  return requestClient.post<boolean>(
    '/hrm/salary/month-record/compute-import',
    data,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

/** 删除月度工资表 */
export function deleteSalaryMonthRecord(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/month-record/delete', {
    params: { id },
  });
}

/** 获得月度工资表详情 */
export function getSalaryMonthRecord(id: number) {
  return requestClient.get<HrmSalaryMonthRecordApi.SalaryMonthRecord>(
    '/hrm/salary/month-record/get',
    { params: { id } },
  );
}

/** 获得最近月度工资表 */
export function getLastSalaryMonthRecord() {
  return requestClient.get<HrmSalaryMonthRecordApi.SalaryMonthRecord>(
    '/hrm/salary/month-record/last',
  );
}

/** 获得薪资核算就绪状态 */
export function getSalaryPayrollReadiness(monthRecordId?: number) {
  return requestClient.get<HrmSalaryMonthRecordApi.PayrollReadiness>(
    '/hrm/salary/month-record/payroll-readiness',
    { params: { monthRecordId } },
  );
}

/** 下载考勤导入模板 */
export function getSalaryAttendanceImportTemplate(monthRecordId?: number) {
  return requestClient.download(
    '/hrm/salary/month-record/get-attendance-import-template',
    { params: { monthRecordId } },
  );
}

/** 下载累计个税导入模板 */
export function getSalaryCumulativeTaxImportTemplate(monthRecordId?: number) {
  return requestClient.download(
    '/hrm/salary/month-record/get-cumulative-tax-import-template',
    { params: { monthRecordId } },
  );
}

/** 下载专项附加扣除导入模板 */
export function getSalaryAdditionalDeductionImportTemplate(
  monthRecordId?: number,
) {
  return requestClient.download(
    '/hrm/salary/month-record/get-additional-deduction-import-template',
    { params: { monthRecordId } },
  );
}

/** 获得月度工资表分页 */
export function getSalaryMonthRecordPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmSalaryMonthRecordApi.SalaryMonthRecord>
  >('/hrm/salary/month-record/page', { params });
}

/** 获得月度工资薪资项汇总 */
export function getSalaryMonthOptionSummary(
  params: Partial<PageParam> & { monthRecordId: number },
) {
  return requestClient.get<HrmSalaryOptionApi.OptionValue[]>(
    '/hrm/salary/month-record/option-summary',
    { params },
  );
}
