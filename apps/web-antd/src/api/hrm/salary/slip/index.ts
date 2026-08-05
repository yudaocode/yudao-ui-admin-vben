import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmSalarySlipApi {
  /** 工资条选项 */
  export interface SlipOption {
    name?: string; // 工资项名称
    type?: number; // 工资项类型
    code?: number; // 编码
    value?: number; // 值
    remark?: string; // 备注
    sort?: number; // 排序
    children?: SlipOption[]; // 子工资条项
  }

  /** 工资条 */
  export interface SalarySlip {
    id?: number; // 编号
    sendRecordId?: number; // 工资条记录编号
    monthEmployeeRecordId?: number; // 员工工资记录编号
    employeeId?: number; // 员工编号
    employeeName?: string; // 员工姓名
    jobNumber?: string; // 工号
    mobile?: string; // 手机号
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    postName?: string; // 职位名称
    year?: number; // 年份
    month?: number; // 月份
    readStatus?: number; // 已读状态
    realPaySalary?: number; // 实发工资
    remark?: string; // 备注
    options?: SlipOption[]; // 选项列表
    createTime?: Date; // 创建时间
  }

  /** 备注请求 */
  export interface RemarkReq {
    id: number; // 编号
    remark?: string; // 备注
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
