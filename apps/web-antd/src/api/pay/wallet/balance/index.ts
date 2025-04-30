import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PayWalletApi {
  /** 用户钱包查询参数 */
  export interface PayWalletUserReqVO {
    userId: number;
  }

  /** 钱包信息 */
  export interface WalletVO {
    id: number;
    userId: number;
    userType: number;
    balance: number;
    totalExpense: number;
    totalRecharge: number;
    freezePrice: number;
  }

  /** 钱包分页请求 */
  export interface WalletPageReqVO extends PageParam {
    userId?: number;
    userType?: number;
    balance?: number;
    totalExpense?: number;
    totalRecharge?: number;
    freezePrice?: number;
  }
}

/** 查询用户钱包详情 */
export function getWallet(params: PayWalletApi.PayWalletUserReqVO) {
  return requestClient.get<PayWalletApi.WalletVO>('/pay/wallet/get', {
    params,
  });
}

/** 查询会员钱包列表 */
export function getWalletPage(params: PayWalletApi.WalletPageReqVO) {
  return requestClient.get<PageResult<PayWalletApi.WalletVO>>(
    '/pay/wallet/page',
    {
      params,
    },
  );
}

/** 修改会员钱包余额 */
export function updateWalletBalance(data: PayWalletApi.WalletVO) {
  return requestClient.put('/pay/wallet/update-balance', data);
}
