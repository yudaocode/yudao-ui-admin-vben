import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmSalarySlipApi {
  /** 工资条选项 */
  export interface SlipOption {
    name?: string;
    type?: number;
    code?: number;
    value?: number;
    remark?: string;
    sort?: number;
    children?: SlipOption[];
  }

  /** 工资条 */
  export interface SalarySlip {
    id?: number;
    sendRecordId?: number;
    monthEmployeeRecordId?: number;
    employeeId?: number;
    employeeName?: string;
    jobNumber?: string;
    mobile?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    year?: number;
    month?: number;
    readStatus?: number;
    realPaySalary?: number;
    remark?: string;
    options?: SlipOption[];
    createTime?: Date;
  }

  /** 备注请求 */
  export interface RemarkReq {
    id: number;
    remark?: string;
  }
}

/** 获得工资条分页 */
export function getSalarySlipPage(params: PageParam) {
  return requestClient.get<PageResult<HrmSalarySlipApi.SalarySlip>>(
    '/hrm/salary/slip/page',
    { params },
  );
}

/** 获得工资条详情 */
export function getSalarySlip(id: number) {
  return requestClient.get<HrmSalarySlipApi.SalarySlip>(
    '/hrm/salary/slip/get',
    {
      params: { id },
    },
  );
}

/** 修改工资条备注 */
export function updateSalarySlipRemark(data: HrmSalarySlipApi.RemarkReq) {
  return requestClient.put<boolean>('/hrm/salary/slip/remark', data);
}
