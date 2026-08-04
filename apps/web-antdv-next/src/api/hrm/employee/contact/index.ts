import { requestClient } from '#/api/request';

export namespace HrmEmployeeContactApi {
  export interface Contact {
    id?: number;
    employeeId?: number;
    name?: string;
    relation?: string;
    phone?: string;
    workUnit?: string;
    postName?: string;
    address?: string;
    sort?: number;
    createTime?: Date;
  }
}

export function getEmployeeContactList(employeeId: number) {
  return requestClient.get<HrmEmployeeContactApi.Contact[]>(
    '/hrm/employee/contact/list',
    { params: { employeeId } },
  );
}
export function createEmployeeContact(data: HrmEmployeeContactApi.Contact) {
  return requestClient.post<number>('/hrm/employee/contact/create', data);
}
export function updateEmployeeContact(data: HrmEmployeeContactApi.Contact) {
  return requestClient.put<boolean>('/hrm/employee/contact/update', data);
}
export function deleteEmployeeContact(id: number) {
  return requestClient.delete<boolean>('/hrm/employee/contact/delete', {
    params: { id },
  });
}
