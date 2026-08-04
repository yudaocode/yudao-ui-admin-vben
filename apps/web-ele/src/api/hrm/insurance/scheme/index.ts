import { requestClient } from '#/api/request';

export namespace HrmInsuranceSchemeApi {
  /** 社保项目 */
  export interface Project {
    id?: number;
    schemeId?: number;
    type?: number;
    name?: string;
    baseAmount?: number;
    corporateRate?: number;
    personalRate?: number;
    corporateAmount?: number;
    personalAmount?: number;
    createTime?: Date;
  }

  /** 社保方案 */
  export interface InsuranceScheme {
    id?: number;
    name?: string;
    areaId?: number;
    areaName?: string;
    householdType?: string;
    type?: number;
    projectList?: Project[];
    socialSecurityProjectList?: Project[];
    providentFundProjectList?: Project[];
    personalInsuranceAmount?: number;
    corporateInsuranceAmount?: number;
    personalProvidentFundAmount?: number;
    corporateProvidentFundAmount?: number;
    useCount?: number;
    monthRecordCount?: number;
    createTime?: Date;
  }
}

/** 查询社保方案精简列表 */
export function getInsuranceSchemeSimpleList() {
  return requestClient.get<HrmInsuranceSchemeApi.InsuranceScheme[]>(
    '/hrm/insurance/scheme/simple-list',
  );
}

/** 查询社保方案 */
export function getInsuranceScheme(id: number) {
  return requestClient.get<HrmInsuranceSchemeApi.InsuranceScheme>(
    '/hrm/insurance/scheme/get',
    { params: { id } },
  );
}

/** 查询社保方案列表 */
export function getInsuranceSchemeList() {
  return requestClient.get<HrmInsuranceSchemeApi.InsuranceScheme[]>(
    '/hrm/insurance/scheme/list',
  );
}

/** 新增社保方案 */
export function createInsuranceScheme(
  data: HrmInsuranceSchemeApi.InsuranceScheme,
) {
  return requestClient.post<number>('/hrm/insurance/scheme/create', data);
}

/** 修改社保方案 */
export function updateInsuranceScheme(
  data: HrmInsuranceSchemeApi.InsuranceScheme,
) {
  return requestClient.put<boolean>('/hrm/insurance/scheme/update', data);
}

/** 删除社保方案 */
export function deleteInsuranceScheme(id: number) {
  return requestClient.delete<boolean>('/hrm/insurance/scheme/delete', {
    params: { id },
  });
}
