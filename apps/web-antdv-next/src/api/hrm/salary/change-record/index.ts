import type { HrmSalaryOptionApi } from '../config/option';

import { requestClient } from '#/api/request';

export namespace HrmSalaryChangeRecordApi {
  /** 调薪记录 */
  export interface SalaryChangeRecord {
    id?: number; // 编号
    employeeId?: number; // 员工编号
    recordType?: number; // 记录类型
    changeReason?: number; // 调整原因
    effectTime?: number; // 生效日期
    beforeTotal?: number; // 调整前正式工资
    afterTotal?: number; // 调整后正式工资
    probationBeforeTotal?: number; // 调整前试用期工资
    probationAfterTotal?: number; // 调整后试用期工资
    status?: number; // 状态
    remark?: string; // 备注
    salaryOptions?: HrmSalaryOptionApi.OptionValue[]; // 薪资项列表
    probationSalaryOptions?: HrmSalaryOptionApi.OptionValue[]; // 试用期薪资项列表
    createTime?: Date; // 创建时间
  }
}

/** 获得员工调薪记录 */
export function getSalaryChangeRecord(id: number) {
  return requestClient.get<HrmSalaryChangeRecordApi.SalaryChangeRecord>(
    '/hrm/salary/change-record/get',
    { params: { id } },
  );
}

/** 获得员工调薪记录列表 */
export function getSalaryChangeRecordList(employeeId: number) {
  return requestClient.get<HrmSalaryChangeRecordApi.SalaryChangeRecord[]>(
    '/hrm/salary/change-record/list',
    { params: { employeeId } },
  );
}

/** 取消员工调薪记录 */
export function cancelSalaryChangeRecord(id: number) {
  return requestClient.put<boolean>('/hrm/salary/change-record/cancel', null, {
    params: { id },
  });
}

/** 删除员工调薪记录 */
export function deleteSalaryChangeRecord(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/change-record/delete', {
    params: { id },
  });
}
