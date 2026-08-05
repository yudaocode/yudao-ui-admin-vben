import type { PageParam, PageResult } from '@vben/request';

import type { HrmSalaryOptionApi } from '../config/option';

import { requestClient } from '#/api/request';

export namespace HrmSalaryMonthRecordApi {
  /** 月度工资表 */
  export interface SalaryMonthRecord {
    id?: number; // 编号
    title?: string; // 标题
    year?: number; // 年份
    month?: number; // 月份
    employeeCount?: number; // 员工数量
    startTime?: string; // 开始日期
    endTime?: string; // 结束日期
    expectedPaySalary?: number; // 应发工资
    personalInsuranceAmount?: number; // 个人社保金额
    personalProvidentFundAmount?: number; // 个人公积金金额
    personalTax?: number; // 个人所得税
    realPaySalary?: number; // 实发工资
    corporateInsuranceAmount?: number; // 公司社保金额
    corporateProvidentFundAmount?: number; // 公司公积金金额
    status?: number; // 工资表状态
    optionHeaders?: HrmSalaryOptionApi.SalaryOption[]; // 薪资项表头
    createTime?: Date; // 创建时间
  }

  /** 薪资核算就绪员工 */
  export interface PayrollReadinessEmployee {
    employeeId?: number; // 员工编号
    employeeName?: string; // 员工姓名
    jobNumber?: string; // 工号
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    postName?: string; // 职位名称
    entryStatus?: number; // 入职状态
    status?: number; // 员工状态
    entryTime?: Date; // 入职时间
  }

  /** 薪资核算就绪状态 */
  export interface PayrollReadiness {
    monthRecordId?: number; // 工资表编号
    title?: string; // 标题
    year?: number; // 年份
    month?: number; // 月份
    startTime?: string; // 开始日期
    endTime?: string; // 结束日期
    socialSecurityYearMonth?: string; // 社保年月
    payrollEmployeeCount?: number; // 计薪员工人数
    salaryEmployeeCount?: number; // 已定薪员工人数
    noSalaryEmployeeCount?: number; // 未定薪员工人数
    noSalaryGroupEmployeeCount?: number; // 未分配薪资组员工人数
    changeEmployeeCount?: number; // 异动员工人数
    changeTypeCountMap?: Record<number, number>; // 变更类型数量映射
    noSalaryEmployees?: PayrollReadinessEmployee[]; // 未定薪员工列表
    noSalaryGroupEmployees?: PayrollReadinessEmployee[]; // 未分配薪资组员工列表
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
export function getSalaryMonthOptionSummary(params: PageParam) {
  return requestClient.get<HrmSalaryOptionApi.OptionValue[]>(
    '/hrm/salary/month-record/option-summary',
    { params },
  );
}
