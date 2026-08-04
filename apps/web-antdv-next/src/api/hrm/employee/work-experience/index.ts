import { requestClient } from '#/api/request';

export namespace HrmEmployeeWorkExperienceApi {
  export interface WorkExperience {
    id?: number;
    employeeId?: number;
    company?: string;
    postName?: string;
    startTime?: number;
    endTime?: number;
    remark?: string;
    sort?: number;
    createTime?: Date;
  }
}

export function getEmployeeWorkExperienceList(employeeId: number) {
  return requestClient.get<HrmEmployeeWorkExperienceApi.WorkExperience[]>(
    '/hrm/employee/work-experience/list',
    { params: { employeeId } },
  );
}
export function createEmployeeWorkExperience(
  data: HrmEmployeeWorkExperienceApi.WorkExperience,
) {
  return requestClient.post<number>(
    '/hrm/employee/work-experience/create',
    data,
  );
}
export function updateEmployeeWorkExperience(
  data: HrmEmployeeWorkExperienceApi.WorkExperience,
) {
  return requestClient.put<boolean>(
    '/hrm/employee/work-experience/update',
    data,
  );
}
export function deleteEmployeeWorkExperience(id: number) {
  return requestClient.delete<boolean>('/hrm/employee/work-experience/delete', {
    params: { id },
  });
}
