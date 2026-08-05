import { requestClient } from '#/api/request';

export namespace HrmInsuranceMonthRecordApi {
  /** 社保月度记录 */
  export interface InsuranceMonthRecord {
    id?: number; // 编号
    title?: string; // 标题
    year?: number; // 年份
    month?: number; // 月份
    insuredEmployeeCount?: number; // 参保人数
    stoppedEmployeeCount?: number; // 停保人数
    status?: number; // 状态
    personalInsuranceAmount?: number; // 个人社保金额
    personalProvidentFundAmount?: number; // 个人公积金金额
    corporateInsuranceAmount?: number; // 公司社保金额
    corporateProvidentFundAmount?: number; // 公司公积金金额
    createTime?: Date; // 创建时间
  }

  /** 社保月度记录创建请求 */
  export interface MonthRecordCreateReq {
    year: number; // 年份
    month: number; // 月份
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
