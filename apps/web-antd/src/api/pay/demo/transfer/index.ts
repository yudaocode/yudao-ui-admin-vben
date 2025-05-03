import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PayDemoTransferApi {
  /** 示例转账单信息 */
  export interface DemoTransfer {
    price: number;
    type: number;
    userName: string;
    alipayLogonId: string;
    openid: string;
  }
}

/** 创建示例转账单 */
export function createDemoTransfer(data: PayDemoTransferApi.DemoTransfer) {
  return requestClient.post('/pay/demo-transfer/create', data);
}

/** 获得示例转账单分页 */
export function getDemoTransferPage(params: PageParam) {
  return requestClient.get<PageResult<PayDemoTransferApi.DemoTransfer>>(
    '/pay/demo-transfer/page',
    {
      params,
    },
  );
}
