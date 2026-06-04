import type { PageParam, PageResult } from '@vben/request';

import type { WmsCheckOrderDetailApi } from './detail';

import { requestClient } from '#/api/request';

export namespace WmsCheckOrderApi {
  /** WMS 盘库单 */
  export interface CheckOrder {
    id?: number;
    no?: string;
    orderTime?: string;
    status?: number;
    remark?: string;
    warehouseId?: number;
    warehouseName?: string;
    totalQuantity?: number;
    totalPrice?: number;
    actualPrice?: number;
    details?: WmsCheckOrderDetailApi.CheckOrderDetail[];
    createTime?: Date;
    creator?: string;
    creatorName?: string;
    updateTime?: Date;
    updater?: string;
    updaterName?: string;
  }
}

export function getCheckOrderPage(params: PageParam) {
  return requestClient.get<PageResult<WmsCheckOrderApi.CheckOrder>>(
    '/wms/check-order/page',
    { params },
  );
}

export function getCheckOrder(id: number) {
  return requestClient.get<WmsCheckOrderApi.CheckOrder>(
    `/wms/check-order/get?id=${id}`,
  );
}

export function getCheckOrderDetailListByOrderId(orderId: number) {
  return requestClient.get<WmsCheckOrderDetailApi.CheckOrderDetail[]>(
    `/wms/check-order-detail/list-by-order-id?orderId=${orderId}`,
  );
}

export function createCheckOrder(data: WmsCheckOrderApi.CheckOrder) {
  return requestClient.post('/wms/check-order/create', data);
}

export function updateCheckOrder(data: WmsCheckOrderApi.CheckOrder) {
  return requestClient.put('/wms/check-order/update', data);
}

export function completeCheckOrder(id: number) {
  return requestClient.put(`/wms/check-order/complete?id=${id}`);
}

export function cancelCheckOrder(id: number) {
  return requestClient.put(`/wms/check-order/cancel?id=${id}`);
}

export function deleteCheckOrder(id: number) {
  return requestClient.delete(`/wms/check-order/delete?id=${id}`);
}

export function exportCheckOrder(params: any) {
  return requestClient.download('/wms/check-order/export-excel', { params });
}
