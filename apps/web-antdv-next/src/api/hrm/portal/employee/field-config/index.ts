import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';

import { requestClient } from '#/api/request';

/** 获得当前员工的档案字段配置 */
export function getEmployeeFieldConfigList() {
  return requestClient.get<HrmEmployeeConfigApi.FieldConfig[]>(
    '/hrm/portal/employee/field-config/list',
  );
}
