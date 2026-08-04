import type { HrmEmployeeEducationExperienceApi } from '#/api/hrm/employee/education-experience';

import { requestClient } from '#/api/request';

/** 获得当前员工的教育经历列表 */
export function getEmployeeEducationExperienceList() {
  return requestClient.get<
    HrmEmployeeEducationExperienceApi.EmployeeEducationExperience[]
  >('/hrm/portal/employee/education-experience/list');
}
