import { requestClient } from '#/api/request';

export namespace HrmEmployeeEducationExperienceApi {
  /** 员工教育经历 */
  export interface EmployeeEducationExperience {
    id?: number; // 教育经历编号
    employeeId?: number; // 员工编号
    school?: string;
    major?: string; // 专业
    education?: number; // 学历
    teachingMethod?: number;
    startTime?: number;
    endTime?: number;
    admissionTime?: number; // 入学日期
    graduationTime?: number; // 毕业日期
    remark?: string;
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
