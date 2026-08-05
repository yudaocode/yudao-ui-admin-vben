import type { PageParam, PageResult } from '@vben/request';

import type { HrmSalarySlipTemplateApi } from '../template';

import { requestClient } from '#/api/request';

export namespace HrmSalarySlipSendRecordApi {
  /** 工资条发放记录 */
  export interface SalarySlipSendRecord {
    id?: number; // 编号
    monthRecordId?: number; // 工资表编号
    employeeCount?: number; // 员工数量
    sendEmployeeCount?: number; // 发薪人数
    readCount?: number; // 已读人数
    year?: number; // 年份
    month?: number; // 月份
    creator?: string; // 创建人
    creatorName?: string; // 创建人名称
    createTime?: Date; // 创建时间
  }

  /** 工资条发送 Request */
  export interface SendReq {
    monthRecordId: number; // 工资表编号
    hideEmpty: boolean; // 是否隐藏空值项
    options: HrmSalarySlipTemplateApi.TemplateOption[]; // 选项列表
    all: boolean; // 是否发放全部筛选结果
    employeeIds?: number[]; // 员工编号列表
    search?: string; // 员工姓名或工号，模糊匹配
    deptId?: number; // 部门编号
    sent?: boolean; // 是否已发送
  }

  /** 工资条待发员工 */
  export interface SendEmployee {
    monthEmployeeRecordId: number; // 员工工资记录编号
    employeeId: number; // 员工编号
    employeeName?: string; // 员工姓名
    jobNumber?: string; // 工号
    mobile?: string; // 手机号
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    postName?: string; // 职位名称
    expectedPaySalary?: number; // 应发工资
    realPaySalary?: number; // 实发工资
    sent: boolean; // 是否已发送
  }
}

/** 发送工资条 */
export function sendSalarySlip(data: HrmSalarySlipSendRecordApi.SendReq) {
  return requestClient.post<number>(
    '/hrm/salary/slip-send-record/create',
    data,
  );
}

/** 获得工资条待发员工分页 */
export function getSalarySlipSendEmployeePage(params: PageParam) {
  return requestClient.get<PageResult<HrmSalarySlipSendRecordApi.SendEmployee>>(
    '/hrm/salary/slip-send-record/employee-page',
    { params },
  );
}

/** 获得工资条发放记录分页 */
export function getSalarySlipSendRecordPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmSalarySlipSendRecordApi.SalarySlipSendRecord>
  >('/hrm/salary/slip-send-record/page', { params });
}

/** 获得工资条发放记录详情 */
export function getSalarySlipSendRecord(id: number) {
  return requestClient.get<HrmSalarySlipSendRecordApi.SalarySlipSendRecord>(
    '/hrm/salary/slip-send-record/get',
    { params: { id } },
  );
}

/** 删除工资条发放记录 */
export function deleteSalarySlipSendRecord(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/slip-send-record/delete', {
    params: { id },
  });
}
