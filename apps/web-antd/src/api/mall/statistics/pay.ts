import { requestClient } from '#/api/request';

export namespace PayStatisticsApi {
  /** 支付统计 */
  export interface PaySummaryRespVO {
    /** 充值金额，单位分 */
    rechargePrice: number;
  }
}

/** 获取钱包充值金额 */
export function getWalletRechargePrice() {
  return requestClient.get<PayStatisticsApi.PaySummaryRespVO>(
    '/statistics/pay/summary',
  );
}
