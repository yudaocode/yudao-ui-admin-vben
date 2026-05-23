import type { PageParam, PageResult } from '@vben/request';

import type { WmsMovementOrderDetailApi } from './detail';

import { requestClient } from '#/api/request';

export namespace WmsMovementOrderApi {
  /** WMS 移库单 */
  export interface MovementOrder {
    id?: number;
    no?: string;
    orderTime?: string;
    status?: number;
    remark?: string;
    sourceWarehouseId?: number;
    sourceWarehouseName?: string;
    targetWarehouseId?: number;
    targetWarehouseName?: string;
    totalQuantity?: number;
    totalPrice?: number;
    details?: WmsMovementOrderDetailApi.MovementOrderDetail[];
    createTime?: Date;
    creator?: string;
    creatorName?: string;
    updateTime?: Date;
    updater?: string;
    updaterName?: string;
  }
}

export function getMovementOrderPage(params: PageParam) {
  return requestClient.get<PageResult<WmsMovementOrderApi.MovementOrder>>(
    '/wms/movement-order/page',
    { params },
  );
}

export function getMovementOrder(id: number) {
  return requestClient.get<WmsMovementOrderApi.MovementOrder>(
    `/wms/movement-order/get?id=${id}`,
  );
}

export function getMovementOrderDetailListByOrderId(orderId: number) {
  return requestClient.get<WmsMovementOrderDetailApi.MovementOrderDetail[]>(
    `/wms/movement-order-detail/list-by-order-id?orderId=${orderId}`,
  );
}

export function createMovementOrder(data: WmsMovementOrderApi.MovementOrder) {
  return requestClient.post('/wms/movement-order/create', data);
}

export function updateMovementOrder(data: WmsMovementOrderApi.MovementOrder) {
  return requestClient.put('/wms/movement-order/update', data);
}

export function completeMovementOrder(id: number) {
  return requestClient.put(`/wms/movement-order/complete?id=${id}`);
}

export function cancelMovementOrder(id: number) {
  return requestClient.put(`/wms/movement-order/cancel?id=${id}`);
}

export function deleteMovementOrder(id: number) {
  return requestClient.delete(`/wms/movement-order/delete?id=${id}`);
}

export function exportMovementOrder(params: any) {
  return requestClient.download('/wms/movement-order/export-excel', { params });
}
