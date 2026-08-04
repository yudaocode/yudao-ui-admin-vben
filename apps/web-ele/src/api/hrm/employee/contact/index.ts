import { requestClient } from '#/api/request';

export namespace HrmEmployeeContactApi {
  /** 员工联系人 */
  export interface EmployeeContact {
    id?: number; // 联系人编号
    employeeId?: number; // 员工编号
    name?: string; // 联系人姓名
    relation?: string; // 关系
    phone?: string; // 联系人电话
    workUnit?: string; // 联系人工作单位
    postName?: string; // 联系人职务
    address?: string; // 联系人地址
    sort?: number; // 排序
    createTime?: Date; // 创建时间
  }
}

/** 查询员工联系人列表 */
export function getEmployeeContactList(employeeId: number) {
  return requestClient.get<HrmEmployeeContactApi.EmployeeContact[]>(
    '/hrm/employee/contact/list',
    { params: { employeeId } },
  );
}

/** 新增员工联系人 */
export function createEmployeeContact(
  data: HrmEmployeeContactApi.EmployeeContact,
) {
  return requestClient.post<number>('/hrm/employee/contact/create', data);
}

/** 修改员工联系人 */
export function updateEmployeeContact(
  data: HrmEmployeeContactApi.EmployeeContact,
) {
  return requestClient.put<boolean>('/hrm/employee/contact/update', data);
}

/** 删除员工联系人 */
export function deleteEmployeeContact(id: number) {
  return requestClient.delete<boolean>('/hrm/employee/contact/delete', {
    params: { id },
  });
}
