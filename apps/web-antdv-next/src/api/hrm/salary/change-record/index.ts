import type { HrmSalaryOptionApi } from '../config/option';

import { requestClient } from '#/api/request';

export namespace HrmSalaryChangeRecordApi {
  export interface ChangeRecord {
    id?: number;
    employeeId?: number;
    recordType?: number;
    changeReason?: number;
    effectTime?: number;
    beforeTotal?: number;
    afterTotal?: number;
    probationBeforeTotal?: number;
    probationAfterTotal?: number;
    status?: number;
    remark?: string;
    salaryOptions?: HrmSalaryOptionApi.OptionValue[];
    probationSalaryOptions?: HrmSalaryOptionApi.OptionValue[];
    createTime?: Date;
  }
}

/** 获得员工调薪记录 */
export function getSalaryChangeRecord(id: number) {
  return requestClient.get<HrmSalaryChangeRecordApi.ChangeRecord>(
    '/hrm/salary/change-record/get',
    { params: { id } },
  );
}

/** 获得员工调薪记录列表 */
export function getSalaryChangeRecordList(employeeId: number) {
  return requestClient.get<HrmSalaryChangeRecordApi.ChangeRecord[]>(
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
