import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MallBrokerageWithdrawApi {
  /** 佣金提现 */
  export interface BrokerageWithdraw {
    /** 编号 */
    id: number;
    /** 用户编号 */
    userId: number;
    /** 提现金额，单位：分 */
    price: number;
    /** 手续费，单位：分 */
    feePrice: number;
    /** 总金额，单位：分 */
    totalPrice: number;
    /** 提现类型 */
    type: number;
    /** 用户名称 */
    userName: string;
    /** 用户账号 */
    userAccount: string;
    /** 银行名称 */
    bankName: string;
    /** 银行地址 */
    bankAddress: string;
    /** 收款码地址 */
    qrCodeUrl: string;
    /** 状态 */
    status: number;
    /** 审核备注 */
    auditReason: string;
    /** 审核时间 */
    auditTime: Date;
    /** 备注 */
    remark: string;
    /** 支付转账编号 */
    payTransferId?: number;
    /** 转账渠道编码 */
    transferChannelCode?: string;
    /** 转账时间 */
    transferTime?: Date;
    /** 转账错误信息 */
    transferErrorMsg?: string;
  }

  /** 驳回申请请求 */
  export interface RejectRequest {
    /** 编号 */
    id: number;
    /** 驳回原因 */
    auditReason: string;
  }
}

/** 查询佣金提现列表 */
export function getBrokerageWithdrawPage(params: PageParam) {
  return requestClient.get<
    PageResult<MallBrokerageWithdrawApi.BrokerageWithdraw>
  >('/trade/brokerage-withdraw/page', { params });
}

/** 查询佣金提现详情 */
export function getBrokerageWithdraw(id: number) {
  return requestClient.get<MallBrokerageWithdrawApi.BrokerageWithdraw>(
    `/trade/brokerage-withdraw/get?id=${id}`,
  );
}

/** 佣金提现 - 通过申请 */
export function approveBrokerageWithdraw(id: number) {
  return requestClient.put(`/trade/brokerage-withdraw/approve?id=${id}`);
}

/** 审核佣金提现 - 驳回申请 */
export function rejectBrokerageWithdraw(
  data: MallBrokerageWithdrawApi.RejectRequest,
) {
  return requestClient.put('/trade/brokerage-withdraw/reject', data);
}
