import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PayDemoApi {
  /** 示例订单信息 */
  export interface DemoOrder {
    spuId: number;
    createTime: Date;
  }
}

/** 创建示例订单 */
export function createDemoOrder(data: PayDemoApi.DemoOrder) {
  return requestClient.post('/pay/demo-order/create', data);
}

/** 获得示例订单 */
export function getDemoOrder(id: number) {
  return requestClient.get<PayDemoApi.DemoOrder>(
    `/pay/demo-order/get?id=${id}`,
  );
}

/** 获得示例订单分页 */
export function getDemoOrderPage(params: PageParam) {
  return requestClient.get<PageResult<PayDemoApi.DemoOrder>>(
    '/pay/demo-order/page',
    {
      params,
    },
  );
}

/** 退款示例订单 */
export function refundDemoOrder(id: number) {
  return requestClient.put(`/pay/demo-order/refund?id=${id}`);
}
