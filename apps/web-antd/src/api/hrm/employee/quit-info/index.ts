import { requestClient } from '#/api/request';

export namespace HrmEmployeeQuitInfoApi {
  export interface QuitInfo {
    id?: number;
    employeeId?: number;
    planQuitTime?: number;
    applyQuitTime?: number;
    salarySettlementTime?: number;
    type?: number;
    reason?: number;
    remark?: string;
    createTime?: Date;
  }
}

export function getEmployeeQuitInfo(employeeId: number) {
  return requestClient.get<HrmEmployeeQuitInfoApi.QuitInfo>(
    '/hrm/employee/quit-info/get',
    { params: { employeeId } },
  );
}
