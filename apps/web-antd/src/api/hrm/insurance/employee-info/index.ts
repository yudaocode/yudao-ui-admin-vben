import { requestClient } from '#/api/request';

export namespace HrmInsuranceEmployeeInfoApi {
  /** 社保员工档案 */
  export interface InsuranceEmployeeInfo {
    id?: number; // 员工参保信息编号
    employeeId?: number; // 员工编号
    firstSocialSecurity?: boolean; // 是否本地首次缴纳社保
    firstAccumulationFund?: boolean; // 是否本地首次缴纳公积金
    socialSecurityNumber?: string; // 社保账号
    accumulationFundNumber?: string; // 公积金账号
    socialSecurityStartMonth?: number; // 社保起缴月份
    schemeId?: number; // 社保方案编号
    schemeName?: string; // 社保方案名称
    createTime?: Date; // 创建时间
  }
}

/** 查询社保员工档案 */
export function getInsuranceEmployeeInfo(employeeId: number) {
  return requestClient.get<HrmInsuranceEmployeeInfoApi.InsuranceEmployeeInfo>(
    '/hrm/insurance/employee-info/get',
    { params: { employeeId } },
  );
}

/** 保存社保员工档案 */
export function saveInsuranceEmployeeInfo(
  data: HrmInsuranceEmployeeInfoApi.InsuranceEmployeeInfo,
) {
  return requestClient.put<number>('/hrm/insurance/employee-info/save', data);
}

/** 修改员工档案 */
export function updateEmployeeScheme(employeeId: number, schemeId: number) {
  return requestClient.put<boolean>(
    '/hrm/insurance/employee-info/update-scheme',
    { employeeId, schemeId },
  );
}
