import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PayRefundApi {
  /** 退款订单信息 */
  export interface Refund {
    id: number;
    merchantId: number;
    appId: number;
    channelId: number;
    channelCode: string;
    orderId: string;
    tradeNo: string;
    merchantOrderId: string;
    merchantRefundNo: string;
    notifyUrl: string;
    notifyStatus: number;
    status: number;
    type: number;
    payAmount: number;
    refundAmount: number;
    reason: string;
    userIp: string;
    channelOrderNo: string;
    channelRefundNo: string;
    channelErrorCode: string;
    channelErrorMsg: string;
    channelExtras: string;
    expireTime: Date;
    successTime: Date;
    notifyTime: Date;
    createTime: Date;
    updateTime: Date;
  }

  /** 退款订单分页请求 */
  export interface RefundPageReq extends PageParam {
    merchantId?: number;
    appId?: number;
    channelId?: number;
    channelCode?: string;
    orderId?: string;
    tradeNo?: string;
    merchantOrderId?: string;
    merchantRefundNo?: string;
    notifyUrl?: string;
    notifyStatus?: number;
    status?: number;
    type?: number;
    payAmount?: number;
    refundAmount?: number;
    reason?: string;
    userIp?: string;
    channelOrderNo?: string;
    channelRefundNo?: string;
    channelErrorCode?: string;
    channelErrorMsg?: string;
    channelExtras?: string;
    expireTime?: Date[];
    successTime?: Date[];
    notifyTime?: Date[];
    createTime?: Date[];
  }

  /** 退款订单导出请求 */
  export interface RefundExportReq {
    merchantId?: number;
    appId?: number;
    channelId?: number;
    channelCode?: string;
    orderId?: string;
    tradeNo?: string;
    merchantOrderId?: string;
    merchantRefundNo?: string;
    notifyUrl?: string;
    notifyStatus?: number;
    status?: number;
    type?: number;
    payAmount?: number;
    refundAmount?: number;
    reason?: string;
    userIp?: string;
    channelOrderNo?: string;
    channelRefundNo?: string;
    channelErrorCode?: string;
    channelErrorMsg?: string;
    channelExtras?: string;
    expireTime?: Date[];
    successTime?: Date[];
    notifyTime?: Date[];
    createTime?: Date[];
  }
}

/** 查询退款订单列表 */
export function getRefundPage(params: PayRefundApi.RefundPageReq) {
  return requestClient.get<PageResult<PayRefundApi.Refund>>(
    '/pay/refund/page',
    {
      params,
    },
  );
}

/** 查询退款订单详情 */
export function getRefund(id: number) {
  return requestClient.get<PayRefundApi.Refund>(`/pay/refund/get?id=${id}`);
}

/** 创建退款订单 */
export function createRefund(data: PayRefundApi.Refund) {
  return requestClient.post('/pay/refund/create', data);
}

/** 更新退款订单 */
export function updateRefund(data: PayRefundApi.Refund) {
  return requestClient.put('/pay/refund/update', data);
}

/** 删除退款订单 */
export function deleteRefund(id: number) {
  return requestClient.delete(`/pay/refund/delete?id=${id}`);
}

/** 导出退款订单 */
export function exportRefund(params: PayRefundApi.RefundExportReq) {
  return requestClient.download('/pay/refund/export-excel', { params });
}
