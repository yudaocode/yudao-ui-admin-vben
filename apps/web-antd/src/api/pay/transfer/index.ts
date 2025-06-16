import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PayTransferApi {
  /** 转账单信息 */
  export interface Transfer {
    id: number;
    appId: number;
    channelId: number;
    channelCode: string;
    merchantTransferId: string;
    type: number;
    price: number;
    subject: string;
    userName: string;
    alipayLogonId: string;
    openid: string;
    status: number;
    createTime: Date;
  }

  /** 转账单分页请求 */
  export interface TransferPageReq extends PageParam {
    appId?: number;
    channelId?: number;
    channelCode?: string;
    merchantTransferId?: string;
    type?: number;
    price?: number;
    subject?: string;
    userName?: string;
    status?: number;
    createTime?: Date[];
  }
}

/** 查询转账单列表 */
export function getTransferPage(params: PayTransferApi.TransferPageReq) {
  return requestClient.get<PageResult<PayTransferApi.Transfer>>(
    '/pay/transfer/page',
    {
      params,
    },
  );
}

/** 查询转账单详情 */
export function getTransfer(id: number) {
  return requestClient.get<PayTransferApi.Transfer>(
    `/pay/transfer/get?id=${id}`,
  );
}

/** 导出转账单 */
export function exportTransfer(params: any) {
  return requestClient.download('/pay/transfer/export-excel', {
    params,
  });
}
