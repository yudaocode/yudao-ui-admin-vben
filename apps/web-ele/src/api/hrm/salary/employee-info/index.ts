import type { PageParam, PageResult } from '@vben/request';

import type { HrmSalaryOptionApi } from '../config/option';

import { requestClient } from '#/api/request';

export namespace HrmSalaryEmployeeInfoApi {
  /** 员工薪资档案 */
  export interface SalaryEmployeeInfo {
    id?: number;
    employeeId?: number;
    employeeName?: string;
    jobNumber?: string;
    mobile?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    entryStatus?: number;
    status?: number;
    entryTime?: Date;
    regularTime?: Date;
    changeReason?: number;
    effectTime?: number;
    changeType?: number;
    probationSalary?: number;
    regularSalary?: number;
    remark?: string;
    salaryOptions?: HrmSalaryOptionApi.OptionValue[];
    probationSalaryOptions?: HrmSalaryOptionApi.OptionValue[];
    createTime?: Date;
  }

  /** 员工薪资信息修改 Request */
  export interface UpdateReq {
    id?: number;
    employeeId?: number;
    recordType?: number;
    changeReason?: number;
    effectTime?: number;
    remark?: string;
    salaryOptions?: HrmSalaryOptionApi.OptionValue[];
    probationSalaryOptions?: HrmSalaryOptionApi.OptionValue[];
  }

  /** 员工薪资信息批量更新 Request */
  export interface UpdateListReq {
    employeeIds: number[];
    deptIds: number[];
    type: number;
    changeReason?: number;
    effectTime?: number;
    remark?: string;
    salaryOptions: HrmSalaryOptionApi.OptionValue[];
  }

  /** 员工薪资信息批量更新响应 */
  export interface UpdateListResp {
    successEmployeeIds: number[];
    failureEmployeeReasons: Record<number, string>;
  }

  /** 员工薪资导入结果 */
  export interface ImportResp {
    successJobNumbers: string[];
    failureJobNumbers: Record<string, string>;
  }

  /** 员工状态数量 */
  export interface StatusCount {
    status: number;
    count: number;
  }
}

/** 获得员工薪资信息分页 */
export function getSalaryEmployeeInfoPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo>
  >('/hrm/salary/employee-info/page', { params });
}

/** 获得员工薪资信息状态数量 */
export function getSalaryEmployeeInfoStatusCount(params: Partial<PageParam>) {
  return requestClient.get<HrmSalaryEmployeeInfoApi.StatusCount[]>(
    '/hrm/salary/employee-info/status-count',
    { params },
  );
}

/** 获得员工薪资信息 */
export function getSalaryEmployeeInfo(employeeId: number) {
  return requestClient.get<HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo>(
    '/hrm/salary/employee-info/get',
    { params: { employeeId } },
  );
}

/** 获得最早调薪生效日期 */
export function getSalaryAdjustmentMinEffectDate() {
  return requestClient.get<string>(
    '/hrm/salary/employee-info/get-adjustment-min-effect-date',
  );
}

/** 修改员工薪资信息 */
export function updateSalaryEmployeeInfo(
  data: HrmSalaryEmployeeInfoApi.UpdateReq,
) {
  return requestClient.put<number>('/hrm/salary/employee-info/update', data);
}

/** 批量更新员工薪资信息 */
export function updateSalaryEmployeeInfoList(
  data: HrmSalaryEmployeeInfoApi.UpdateListReq,
) {
  return requestClient.put<HrmSalaryEmployeeInfoApi.UpdateListResp>(
    '/hrm/salary/employee-info/update-list',
    data,
  );
}

/** 下载定薪导入模板 */
export function getFixSalaryImportTemplate() {
  return requestClient.download(
    '/hrm/salary/employee-info/get-fix-import-template',
  );
}

/** 下载调薪导入模板 */
export function getChangeSalaryImportTemplate() {
  return requestClient.download(
    '/hrm/salary/employee-info/get-change-import-template',
  );
}

/** 导入定薪/调薪 */
export function importSalaryEmployeeInfo(file: File, type: 'change' | 'fix') {
  return requestClient.upload<HrmSalaryEmployeeInfoApi.ImportResp>(
    `/hrm/salary/employee-info/import-${type}`,
    { file },
  );
}
