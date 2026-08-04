import { requestClient } from '#/api/request';

export namespace HrmInsuranceEmployeeInfoApi {
  export interface EmployeeInfo {
    id?: number;
    employeeId?: number;
    firstSocialSecurity?: boolean;
    firstAccumulationFund?: boolean;
    socialSecurityNumber?: string;
    accumulationFundNumber?: string;
    socialSecurityStartMonth?: number;
    schemeId?: number;
    schemeName?: string;
    createTime?: Date;
  }
}

export function getInsuranceEmployeeInfo(employeeId: number) {
  return requestClient.get<HrmInsuranceEmployeeInfoApi.EmployeeInfo>(
    '/hrm/insurance/employee-info/get',
    { params: { employeeId } },
  );
}
export function saveInsuranceEmployeeInfo(
  data: HrmInsuranceEmployeeInfoApi.EmployeeInfo,
) {
  return requestClient.put<number>('/hrm/insurance/employee-info/save', data);
}
export function updateEmployeeScheme(employeeId: number, schemeId: number) {
  return requestClient.put<boolean>(
    '/hrm/insurance/employee-info/update-scheme',
    { employeeId, schemeId },
  );
}
