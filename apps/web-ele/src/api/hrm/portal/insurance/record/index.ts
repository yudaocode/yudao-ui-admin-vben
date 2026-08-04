import { requestClient } from '#/api/request';

export namespace HrmPortalInsuranceRecordApi {
  export interface SchemeProject {
    schemeProjectId?: number;
    type?: number;
    name: string;
    baseAmount?: number;
    corporateRate?: number;
    personalRate?: number;
    corporateAmount?: number;
    personalAmount?: number;
  }

  export interface Record {
    id: number;
    monthRecordId?: number;
    employeeId: number;
    schemeId?: number;
    schemeName?: string;
    schemeType?: number;
    schemeCity?: string;
    year: number;
    month: number;
    personalInsuranceAmount?: number;
    personalProvidentFundAmount?: number;
    corporateInsuranceAmount?: number;
    corporateProvidentFundAmount?: number;
    status?: number;
    createTime?: Date;
    projects?: SchemeProject[];
  }

  export type Project = SchemeProject;
}

/** 获得我的社保记录列表 */
export function getInsuranceRecordList(params?: { year?: number }) {
  return requestClient.get<HrmPortalInsuranceRecordApi.Record[]>(
    '/hrm/portal/insurance/record/list',
    { params },
  );
}

/** 获得我的社保记录详情 */
export function getInsuranceRecord(id: number) {
  return requestClient.get<HrmPortalInsuranceRecordApi.Record>(
    '/hrm/portal/insurance/record/get',
    { params: { id } },
  );
}
