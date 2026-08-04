import type { HrmEmployeeQuitInfoApi } from '#/api/hrm/employee/quit-info';

import { requestClient } from '#/api/request';

/** 获得当前员工的离职信息 */
export function getEmployeeQuitInfo() {
  return requestClient.get<HrmEmployeeQuitInfoApi.EmployeeQuitInfo>(
    '/hrm/portal/employee/quit-info/get',
  );
}
