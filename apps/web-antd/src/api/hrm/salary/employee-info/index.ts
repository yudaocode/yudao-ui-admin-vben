import type { PageParam, PageResult } from '@vben/request';

import type { HrmSalaryOptionApi } from '../config/option';

import { requestClient } from '#/api/request';

export namespace HrmSalaryEmployeeInfoApi {
  /** 员工薪资档案 */
  export interface SalaryEmployeeInfo {
    id?: number; // 编号
    employeeId?: number; // 员工编号
    employeeName?: string; // 员工姓名
    jobNumber?: string; // 工号
    mobile?: string; // 手机号
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    postName?: string; // 职位名称
    entryStatus?: number; // 入职状态
    status?: number; // 员工状态
    entryTime?: Date; // 入职时间
    regularTime?: Date; // 转正时间
    changeReason?: number; // 调整原因
    effectTime?: number; // 生效日期
    changeType?: number; // 薪资状态
    probationSalary?: number; // 试用期工资
    regularSalary?: number; // 正式工资
    remark?: string; // 备注
    salaryOptions?: HrmSalaryOptionApi.OptionValue[]; // 薪资项列表
    probationSalaryOptions?: HrmSalaryOptionApi.OptionValue[]; // 试用期薪资项列表
    createTime?: Date; // 创建时间
  }

  /** 员工薪资信息修改 Request */
  export interface UpdateReq {
    id?: number; // 编号
    employeeId?: number; // 员工编号
    recordType?: number; // 记录类型
    changeReason?: number; // 调整原因
    effectTime?: number; // 生效日期
    remark?: string; // 备注
    salaryOptions?: HrmSalaryOptionApi.OptionValue[]; // 薪资项列表
    probationSalaryOptions?: HrmSalaryOptionApi.OptionValue[]; // 试用期薪资项列表
  }

  /** 员工薪资信息批量更新 Request */
  export interface UpdateListReq {
    employeeIds: number[]; // 员工编号列表
    deptIds: number[]; // 部门编号数组
    type: number; // 聘用形式
    changeReason?: number; // 调整原因
    effectTime?: number; // 生效日期
    remark?: string; // 备注
    salaryOptions: HrmSalaryOptionApi.OptionValue[]; // 薪资项列表
  }

  /** 员工薪资信息批量更新响应 */
  export interface UpdateListResp {
    successEmployeeIds: number[];
    failureEmployeeReasons: Record<number, string>;
  }

  /** 员工薪资导入结果 */
  export interface ImportResp {
    successJobNumbers: string[]; // 导入成功的工号数组
    failureJobNumbers: Record<string, string>; // 导入失败的工号及原因
  }

  /** 员工状态数量 */
  export interface StatusCount {
    status: number; // 候选人状态
    count: number; // 候选人数量
  }
}

/** 获得员工薪资信息分页 */
export function getSalaryEmployeeInfoPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo>
  >('/hrm/salary/employee-info/page', { params });
}

/** 获得员工薪资信息状态数量 */
export function getSalaryEmployeeInfoStatusCount(params: PageParam) {
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
