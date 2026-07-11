import { requestClient } from '#/api/request';

export namespace CrmStatisticsPerformanceTargetApi {
  /** 业绩目标完成情况请求 */
  export interface PerformanceTargetReqVO {
    deptId: number;
    userId?: number;
    year: number;
    bizType: number;
  }

  /** 业绩目标完成情况响应 */
  export interface PerformanceTargetRespVO {
    month: number;
    targetPrice: number;
    currentPrice: number;
    completionRate: number;
  }
}

/** 获得业绩目标完成情况 */
export function getPerformanceTargetSummary(
  params: CrmStatisticsPerformanceTargetApi.PerformanceTargetReqVO,
) {
  return requestClient.get<
    CrmStatisticsPerformanceTargetApi.PerformanceTargetRespVO[]
  >('/crm/statistics-performance-target/get-performance-target-summary', {
    params,
  });
}
