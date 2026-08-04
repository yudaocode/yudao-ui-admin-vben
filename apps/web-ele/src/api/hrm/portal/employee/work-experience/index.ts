import type { HrmEmployeeWorkExperienceApi } from '#/api/hrm/employee/work-experience';

import { requestClient } from '#/api/request';

/** 获得当前员工的工作经历列表 */
export function getEmployeeWorkExperienceList() {
  return requestClient.get<
    HrmEmployeeWorkExperienceApi.EmployeeWorkExperience[]
  >('/hrm/portal/employee/work-experience/list');
}
