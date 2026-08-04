import { requestClient } from '#/api/request';

export namespace HrmInsuranceSchemeApi {
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

  export interface Scheme {
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

export function getInsuranceSchemeSimpleList() {
  return requestClient.get<HrmInsuranceSchemeApi.Scheme[]>(
    '/hrm/insurance/scheme/simple-list',
  );
}

export function getInsuranceScheme(id: number) {
  return requestClient.get<HrmInsuranceSchemeApi.Scheme>(
    '/hrm/insurance/scheme/get',
    { params: { id } },
  );
}

export function getInsuranceSchemeList() {
  return requestClient.get<HrmInsuranceSchemeApi.Scheme[]>(
    '/hrm/insurance/scheme/list',
  );
}

export function createInsuranceScheme(data: HrmInsuranceSchemeApi.Scheme) {
  return requestClient.post<number>('/hrm/insurance/scheme/create', data);
}

export function updateInsuranceScheme(data: HrmInsuranceSchemeApi.Scheme) {
  return requestClient.put<boolean>('/hrm/insurance/scheme/update', data);
}

export function deleteInsuranceScheme(id: number) {
  return requestClient.delete<boolean>('/hrm/insurance/scheme/delete', {
    params: { id },
  });
}
