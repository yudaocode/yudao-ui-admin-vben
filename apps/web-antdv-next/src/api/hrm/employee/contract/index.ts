import { requestClient } from '#/api/request';

export namespace HrmEmployeeContractApi {
  export interface Contract {
    id?: number;
    employeeId?: number;
    no?: string;
    type?: number;
    startTime?: number;
    endTime?: number;
    term?: number;
    status?: number;
    signCompany?: string;
    signTime?: number;
    remark?: string;
    expireRemind?: boolean;
    fileUrls?: string[];
    sort?: number;
    createTime?: Date;
  }
}

export function getEmployeeContractList(employeeId: number) {
  return requestClient.get<HrmEmployeeContractApi.Contract[]>(
    '/hrm/employee/contract/list',
    { params: { employeeId } },
  );
}
export function createEmployeeContract(data: HrmEmployeeContractApi.Contract) {
  return requestClient.post<number>('/hrm/employee/contract/create', data);
}
export function updateEmployeeContract(data: HrmEmployeeContractApi.Contract) {
  return requestClient.put<boolean>('/hrm/employee/contract/update', data);
}
export function deleteEmployeeContract(id: number) {
  return requestClient.delete<boolean>('/hrm/employee/contract/delete', {
    params: { id },
  });
}
