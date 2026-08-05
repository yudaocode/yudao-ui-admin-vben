import { requestClient } from '#/api/request';

export namespace HrmEmployeeEducationExperienceApi {
  /** 员工教育经历 */
  export interface EmployeeEducationExperience {
    id?: number; // 教育经历编号
    employeeId?: number; // 员工编号
    education?: number; // 学历
    graduateSchool?: string; // 毕业院校
    major?: string; // 专业
    admissionTime?: number; // 入学日期
    graduationTime?: number; // 毕业日期
    teachingMethods?: number; // 教学方式
    firstDegree?: boolean; // 是否第一学历
    sort?: number; // 排序
    createTime?: Date; // 创建时间
  }
}

/** 查询员工教育经历列表 */
export function getEmployeeEducationExperienceList(employeeId: number) {
  return requestClient.get<
    HrmEmployeeEducationExperienceApi.EmployeeEducationExperience[]
  >('/hrm/employee/education-experience/list', { params: { employeeId } });
}

/** 新增员工教育经历 */
export function createEmployeeEducationExperience(
  data: HrmEmployeeEducationExperienceApi.EmployeeEducationExperience,
) {
  return requestClient.post<number>(
    '/hrm/employee/education-experience/create',
    data,
  );
}

/** 修改员工教育经历 */
export function updateEmployeeEducationExperience(
  data: HrmEmployeeEducationExperienceApi.EmployeeEducationExperience,
) {
  return requestClient.put<boolean>(
    '/hrm/employee/education-experience/update',
    data,
  );
}

/** 删除员工教育经历 */
export function deleteEmployeeEducationExperience(id: number) {
  return requestClient.delete<boolean>(
    '/hrm/employee/education-experience/delete',
    { params: { id } },
  );
}
