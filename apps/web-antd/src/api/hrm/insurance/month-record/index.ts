import { requestClient } from '#/api/request';

export namespace HrmInsuranceMonthRecordApi {
  /** 社保月度记录 */
  export interface InsuranceMonthRecord {
    id?: number;
    title?: string;
    year?: number;
    month?: number;
    insuredEmployeeCount?: number;
    stoppedEmployeeCount?: number;
    status?: number;
    personalInsuranceAmount?: number;
    personalProvidentFundAmount?: number;
    corporateInsuranceAmount?: number;
    corporateProvidentFundAmount?: number;
    createTime?: Date;
  }

  /** 社保月度记录创建请求 */
  export interface MonthRecordCreateReq {
    year: number;
    month: number;
  }
}

/** 新增社保月度记录 */
export function createFirstInsuranceMonthRecord(
  data: HrmInsuranceMonthRecordApi.MonthRecordCreateReq,
) {
  return requestClient.post<number>(
    '/hrm/insurance/month-record/create-first',
    data,
  );
}

/** 新增社保月度记录 */
export function createNextInsuranceMonthRecord() {
  return requestClient.post<number>('/hrm/insurance/month-record/create-next');
}

/** 删除社保月度记录 */
export function deleteInsuranceMonthRecord(id: number) {
  return requestClient.delete<boolean>('/hrm/insurance/month-record/delete', {
    params: { id },
  });
}

/** 查询社保月度记录 */
export function getInsuranceMonthRecord(id: number) {
  return requestClient.get<HrmInsuranceMonthRecordApi.InsuranceMonthRecord>(
    '/hrm/insurance/month-record/get',
    { params: { id } },
  );
}

/** 查询LastInsuranceMonthRecord */
export function getLastInsuranceMonthRecord() {
  return requestClient.get<HrmInsuranceMonthRecordApi.InsuranceMonthRecord>(
    '/hrm/insurance/month-record/last',
  );
}

/** 查询社保月度记录列表 */
export function getInsuranceMonthRecordList(year?: number) {
  return requestClient.get<HrmInsuranceMonthRecordApi.InsuranceMonthRecord[]>(
    '/hrm/insurance/month-record/list',
    { params: { year } },
  );
}
