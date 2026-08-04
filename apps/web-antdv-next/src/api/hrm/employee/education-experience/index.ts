import { requestClient } from '#/api/request';

export namespace HrmEmployeeEducationExperienceApi {
  export interface EducationExperience {
    id?: number;
    employeeId?: number;
    school?: string;
    major?: string;
    education?: number;
    teachingMethod?: number;
    startTime?: number;
    endTime?: number;
    admissionTime?: number;
    graduationTime?: number;
    remark?: string;
    sort?: number;
    createTime?: Date;
  }
}

export function getEmployeeEducationExperienceList(employeeId: number) {
  return requestClient.get<
    HrmEmployeeEducationExperienceApi.EducationExperience[]
  >('/hrm/employee/education-experience/list', { params: { employeeId } });
}
export function createEmployeeEducationExperience(
  data: HrmEmployeeEducationExperienceApi.EducationExperience,
) {
  return requestClient.post<number>(
    '/hrm/employee/education-experience/create',
    data,
  );
}
export function updateEmployeeEducationExperience(
  data: HrmEmployeeEducationExperienceApi.EducationExperience,
) {
  return requestClient.put<boolean>(
    '/hrm/employee/education-experience/update',
    data,
  );
}
export function deleteEmployeeEducationExperience(id: number) {
  return requestClient.delete<boolean>(
    '/hrm/employee/education-experience/delete',
    { params: { id } },
  );
}
