import { requestClient } from '#/api/request';

export namespace HrmPortalInsuranceRecordApi {
  /** SchemeProject */
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

  /** 员工端社保记录 */
  export interface PortalInsuranceRecord {
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
}

/** 获得我的社保记录列表 */
export function getInsuranceRecordList(params?: { year?: number }) {
  return requestClient.get<HrmPortalInsuranceRecordApi.PortalInsuranceRecord[]>(
    '/hrm/portal/insurance/record/list',
    { params },
  );
}

/** 获得我的社保记录详情 */
export function getInsuranceRecord(id: number) {
  return requestClient.get<HrmPortalInsuranceRecordApi.PortalInsuranceRecord>(
    '/hrm/portal/insurance/record/get',
    { params: { id } },
  );
}
