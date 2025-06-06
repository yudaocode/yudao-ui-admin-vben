import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MallBrokerageRecordApi {
  /** 佣金记录 */
  export interface BrokerageRecord {
    /** 编号 */
    id: number;
    /** 用户编号 */
    userId: number;
    /** 用户昵称 */
    userNickname: string;
    /** 用户头像 */
    userAvatar: string;
    /** 佣金金额，单位：分 */
    price: number;
    /** 佣金类型 */
    type: number;
    /** 关联订单编号 */
    orderId: number;
    /** 关联订单号 */
    orderNo: string;
    /** 创建时间 */
    createTime: Date;
    /** 状态 */
    status: number;
    /** 结算时间 */
    settlementTime: Date;
  }
}

/** 查询佣金记录列表 */
export function getBrokerageRecordPage(params: PageParam) {
  return requestClient.get<PageResult<MallBrokerageRecordApi.BrokerageRecord>>(
    '/trade/brokerage-record/page',
    { params },
  );
}

/** 查询佣金记录详情 */
export function getBrokerageRecord(id: number) {
  return requestClient.get<MallBrokerageRecordApi.BrokerageRecord>(
    `/trade/brokerage-record/get?id=${id}`,
  );
}
