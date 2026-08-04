import { requestClient } from '#/api/request';

export namespace HrmEmployeeSalaryCardApi {
  export interface SalaryCard {
    id?: number;
    employeeId?: number;
    bankCardNumber?: string;
    bankAreaId?: number;
    bankAreaName?: string;
    bankName?: string;
    bankBranchName?: string;
    createTime?: Date;
  }
}

export function getEmployeeSalaryCard(employeeId: number) {
  return requestClient.get<HrmEmployeeSalaryCardApi.SalaryCard>(
    '/hrm/employee/salary-card/get',
    { params: { employeeId } },
  );
}
export function saveEmployeeSalaryCard(
  data: HrmEmployeeSalaryCardApi.SalaryCard,
) {
  return requestClient.put<number>('/hrm/employee/salary-card/save', data);
}
export function deleteEmployeeSalaryCard(employeeId: number) {
  return requestClient.delete<boolean>('/hrm/employee/salary-card/delete', {
    params: { employeeId },
  });
}
