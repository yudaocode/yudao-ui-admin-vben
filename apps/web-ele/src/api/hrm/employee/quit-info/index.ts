import { requestClient } from '#/api/request';

export namespace HrmEmployeeQuitInfoApi {
  /** 员工离职信息 */
  export interface EmployeeQuitInfo {
    id?: number; // 离职信息编号
    employeeId?: number; // 员工编号
    planQuitTime?: number; // 计划离职时间
    applyQuitTime?: number; // 申请离职时间
    salarySettlementTime?: number; // 薪资结算时间
    type?: number; // 离职类型
    reason?: number; // 离职原因
    oldEmployeeStatus?: number; // 原员工状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询员工离职信息 */
export function getEmployeeQuitInfo(employeeId: number) {
  return requestClient.get<HrmEmployeeQuitInfoApi.EmployeeQuitInfo>(
    '/hrm/employee/quit-info/get',
    { params: { employeeId } },
  );
}
