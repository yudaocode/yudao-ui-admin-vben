import type { PageParam, PageResult } from '@vben/request';

import type { HrmSalarySlipTemplateApi } from '../template';

import { requestClient } from '#/api/request';

export namespace HrmSalarySlipSendRecordApi {
  /** 工资条发放记录 */
  export interface SendRecord {
    id?: number;
    monthRecordId?: number;
    employeeCount?: number;
    sendEmployeeCount?: number;
    readCount?: number;
    year?: number;
    month?: number;
    creator?: string;
    creatorName?: string;
    createTime?: Date;
  }

  /** 工资条发送 Request */
  export interface SendReq {
    monthRecordId: number;
    hideEmpty: boolean;
    options: HrmSalarySlipTemplateApi.TemplateOption[];
    all: boolean;
    employeeIds?: number[];
    search?: string;
    deptId?: number;
    sent?: boolean;
  }

  /** 工资条待发员工 */
  export interface SendEmployee {
    monthEmployeeRecordId: number;
    employeeId: number;
    employeeName?: string;
    jobNumber?: string;
    mobile?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    expectedPaySalary?: number;
    realPaySalary?: number;
    sent: boolean;
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
  return requestClient.get<PageResult<HrmSalarySlipSendRecordApi.SendRecord>>(
    '/hrm/salary/slip-send-record/page',
    { params },
  );
}

/** 获得工资条发放记录详情 */
export function getSalarySlipSendRecord(id: number) {
  return requestClient.get<HrmSalarySlipSendRecordApi.SendRecord>(
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
