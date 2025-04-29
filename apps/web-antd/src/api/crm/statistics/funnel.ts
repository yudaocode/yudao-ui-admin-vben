import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CrmStatisticsFunnelApi {
  /** 销售漏斗统计数据 */
  export interface FunnelSummary {
    customerCount: number; // 客户数
    businessCount: number; // 商机数
    businessWinCount: number; // 赢单数
  }

  /** 商机分析(按日期) */
  export interface BusinessSummaryByDate {
    time: string; // 时间
    businessCreateCount: number; // 商机数
    totalPrice: number | string; // 商机金额
  }

  /** 商机转化率分析(按日期) */
  export interface BusinessInversionRateSummaryByDate {
    time: string; // 时间
    businessCount: number; // 商机数量
    businessWinCount: number; // 赢单商机数
  }
}

/** 获取销售漏斗统计数据 */
export function getFunnelSummary(params: PageParam) {
  return requestClient.get<CrmStatisticsFunnelApi.FunnelSummary>(
    '/crm/statistics-funnel/get-funnel-summary',
    { params },
  );
}

/** 获取商机结束状态统计 */
export function getBusinessSummaryByEndStatus(params: PageParam) {
  return requestClient.get<Record<string, number>>(
    '/crm/statistics-funnel/get-business-summary-by-end-status',
    { params },
  );
}

/** 获取新增商机分析(按日期) */
export function getBusinessSummaryByDate(params: PageParam) {
  return requestClient.get<CrmStatisticsFunnelApi.BusinessSummaryByDate[]>(
    '/crm/statistics-funnel/get-business-summary-by-date',
    { params },
  );
}

/** 获取商机转化率分析(按日期) */
export function getBusinessInversionRateSummaryByDate(params: PageParam) {
  return requestClient.get<
    CrmStatisticsFunnelApi.BusinessInversionRateSummaryByDate[]
  >('/crm/statistics-funnel/get-business-inversion-rate-summary-by-date', {
    params,
  });
}

/** 获取商机列表(按日期) */
export function getBusinessPageByDate(params: PageParam) {
  return requestClient.get<PageResult<any>>(
    '/crm/statistics-funnel/get-business-page-by-date',
    { params },
  );
}
