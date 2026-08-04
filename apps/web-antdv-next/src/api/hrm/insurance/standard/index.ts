import { requestClient } from '#/api/request';

export namespace HrmInsuranceStandardApi {
  export interface Type {
    code: string;
    name: string;
  }

  export interface Project {
    type: number;
    name: string;
    baseAmount?: number;
    corporateRate?: number;
    personalRate?: number;
    corporateAmount?: number;
    personalAmount?: number;
  }
}

export function getInsuranceStandardTypeList(areaId: number) {
  return requestClient.get<HrmInsuranceStandardApi.Type[]>(
    '/hrm/insurance/standard/type-list',
    { params: { areaId } },
  );
}

export function getInsuranceStandardProjectList(params: {
  areaId: number;
  typeCode: string;
}) {
  return requestClient.get<HrmInsuranceStandardApi.Project[]>(
    '/hrm/insurance/standard/project-list',
    { params },
  );
}
