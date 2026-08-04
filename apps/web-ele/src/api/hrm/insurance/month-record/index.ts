import { requestClient } from '#/api/request';

export namespace HrmInsuranceMonthRecordApi {
  export interface MonthRecord {
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

  export interface MonthRecordCreateReq {
    year: number;
    month: number;
  }
}

export function createFirstInsuranceMonthRecord(
  data: HrmInsuranceMonthRecordApi.MonthRecordCreateReq,
) {
  return requestClient.post<number>(
    '/hrm/insurance/month-record/create-first',
    data,
  );
}

export function createNextInsuranceMonthRecord() {
  return requestClient.post<number>('/hrm/insurance/month-record/create-next');
}

export function deleteInsuranceMonthRecord(id: number) {
  return requestClient.delete<boolean>('/hrm/insurance/month-record/delete', {
    params: { id },
  });
}

export function getInsuranceMonthRecord(id: number) {
  return requestClient.get<HrmInsuranceMonthRecordApi.MonthRecord>(
    '/hrm/insurance/month-record/get',
    { params: { id } },
  );
}

export function getLastInsuranceMonthRecord() {
  return requestClient.get<HrmInsuranceMonthRecordApi.MonthRecord>(
    '/hrm/insurance/month-record/last',
  );
}

export function getInsuranceMonthRecordList(year?: number) {
  return requestClient.get<HrmInsuranceMonthRecordApi.MonthRecord[]>(
    '/hrm/insurance/month-record/list',
    { params: { year } },
  );
}
