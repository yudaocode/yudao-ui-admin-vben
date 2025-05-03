import type { PageParam } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CrmStatisticsPerformanceApi {
  /** 员工业绩统计 */
  export interface Performance {
    time: string;
    currentMonthCount: number;
    lastMonthCount: number;
    lastYearCount: number;
  }
}

/** 员工获得合同金额统计 */
export function getContractPricePerformance(params: PageParam) {
  return requestClient.get<CrmStatisticsPerformanceApi.Performance[]>(
    '/crm/statistics-performance/get-contract-price-performance',
    { params },
  );
}

/** 员工获得回款统计 */
export function getReceivablePricePerformance(params: PageParam) {
  return requestClient.get<CrmStatisticsPerformanceApi.Performance[]>(
    '/crm/statistics-performance/get-receivable-price-performance',
    { params },
  );
}

/** 员工获得签约合同数量统计 */
export function getContractCountPerformance(params: PageParam) {
  return requestClient.get<CrmStatisticsPerformanceApi.Performance[]>(
    '/crm/statistics-performance/get-contract-count-performance',
    { params },
  );
}
