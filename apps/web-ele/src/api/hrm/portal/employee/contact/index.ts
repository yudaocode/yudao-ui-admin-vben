import type { HrmEmployeeContactApi } from '#/api/hrm/employee/contact';

import { requestClient } from '#/api/request';

/** 获得当前员工的联系人列表 */
export function getEmployeeContactList() {
  return requestClient.get<HrmEmployeeContactApi.EmployeeContact[]>(
    '/hrm/portal/employee/contact/list',
  );
}
