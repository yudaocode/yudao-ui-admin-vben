import type { HrmEmployeeTrainingExperienceApi } from '#/api/hrm/employee/training-experience';

import { requestClient } from '#/api/request';

/** 获得当前员工的培训经历列表 */
export function getEmployeeTrainingExperienceList() {
  return requestClient.get<
    HrmEmployeeTrainingExperienceApi.EmployeeTrainingExperience[]
  >('/hrm/portal/employee/training-experience/list');
}
