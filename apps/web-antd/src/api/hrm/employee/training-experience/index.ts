import { requestClient } from '#/api/request';

export namespace HrmEmployeeTrainingExperienceApi {
  export interface TrainingExperience {
    id?: number;
    employeeId?: number;
    name?: string;
    organization?: string;
    startTime?: number;
    endTime?: number;
    certificate?: string;
    remark?: string;
    sort?: number;
    createTime?: Date;
  }
}

export function getEmployeeTrainingExperienceList(employeeId: number) {
  return requestClient.get<
    HrmEmployeeTrainingExperienceApi.TrainingExperience[]
  >('/hrm/employee/training-experience/list', { params: { employeeId } });
}
export function createEmployeeTrainingExperience(
  data: HrmEmployeeTrainingExperienceApi.TrainingExperience,
) {
  return requestClient.post<number>(
    '/hrm/employee/training-experience/create',
    data,
  );
}
export function updateEmployeeTrainingExperience(
  data: HrmEmployeeTrainingExperienceApi.TrainingExperience,
) {
  return requestClient.put<boolean>(
    '/hrm/employee/training-experience/update',
    data,
  );
}
export function deleteEmployeeTrainingExperience(id: number) {
  return requestClient.delete<boolean>(
    '/hrm/employee/training-experience/delete',
    { params: { id } },
  );
}
