import type { PageParam } from '@vben/request';

import { requestClient } from '#/api/request';

/** 获得支付通知明细 */
export function getNotifyTaskDetail(id: number) {
  return requestClient.get(`/pay/notify/get-detail?id=${id}`);
}

/** 获得支付通知分页 */
export function getNotifyTaskPage(params: PageParam) {
  return requestClient.get('/pay/notify/page', {
    params,
  });
}
