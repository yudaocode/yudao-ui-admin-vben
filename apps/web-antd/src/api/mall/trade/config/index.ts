import { requestClient } from '#/api/request';

export namespace TradeConfigApi {
  /** 交易中心配置 */
  export interface Config {
    /** 是否启用分销 */
    brokerageEnabled: boolean;
    /** 分销资格条件 */
    brokerageEnabledCondition: number;
    /** 分销绑定模式 */
    brokerageBindMode: number;
    /** 分销海报图 */
    brokeragePosterUrls: string;
    /** 一级分销比例 */
    brokerageFirstPercent: number;
    /** 二级分销比例 */
    brokerageSecondPercent: number;
    /** 最小提现金额，单位：分 */
    brokerageWithdrawMinPrice: number;
    /** 冻结天数 */
    brokerageFrozenDays: number;
    /** 提现类型 */
    brokerageWithdrawTypes: string;
  }
}

/** 查询交易中心配置详情 */
export function getTradeConfig() {
  return requestClient.get<TradeConfigApi.Config>('/trade/config/get');
}

/** 保存交易中心配置 */
export function saveTradeConfig(data: TradeConfigApi.Config) {
  return requestClient.put('/trade/config/save', data);
}
