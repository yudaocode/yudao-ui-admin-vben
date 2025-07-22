import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PurchaseOrderApi {
  /** 采购订单产品信息 */
  export interface PurchaseOrderItem {
    id?: number;
    productId?: number;
    productName?: string;
    productBarCode?: string;
    productUnitId?: number;
    productUnitName?: string;
    productPrice?: number;
    count?: number;
    totalPrice?: number;
    taxPercent?: number;
    taxPrice?: number;
    totalTaxPrice?: number;
    remark?: string;
    stockCount?: number;
  }

  /** ERP 采购订单信息 */
  export interface PurchaseOrder {
    id?: number;
    no?: string;
    supplierId?: number;
    supplierName?: string;
    orderTime?: Date | string;
    totalCount?: number;
    totalPrice?: number;
    totalProductPrice?: number;
    discountPercent?: number;
    discountPrice?: number;
    depositPrice?: number;
    accountId?: number;
    status?: number;
    remark?: string;
    fileUrl?: string;
    inCount?: number;
    returnCount?: number;
    inStatus?: number;
    returnStatus?: number;
    productNames?: string;
    creatorName?: string;
    createTime?: Date;
    items?: PurchaseOrderItem[];
  }

  /** 采购订单分页查询参数 */
  export interface PurchaseOrderPageParam extends PageParam {
    no?: string;
    supplierId?: number;
    productId?: number;
    orderTime?: string[];
    status?: number;
    remark?: string;
    creator?: string;
    inStatus?: number;
    returnStatus?: number;
  }
}

/** 查询采购订单分页 */
export function getPurchaseOrderPage(
  params: PurchaseOrderApi.PurchaseOrderPageParam,
) {
  return requestClient.get<PageResult<PurchaseOrderApi.PurchaseOrder>>(
    '/erp/purchase-order/page',
    { params },
  );
}

/** 查询采购订单详情 */
export function getPurchaseOrder(id: number) {
  return requestClient.get<PurchaseOrderApi.PurchaseOrder>(
    `/erp/purchase-order/get?id=${id}`,
  );
}

/** 新增采购订单 */
export function createPurchaseOrder(data: PurchaseOrderApi.PurchaseOrder) {
  return requestClient.post('/erp/purchase-order/create', data);
}

/** 修改采购订单 */
export function updatePurchaseOrder(data: PurchaseOrderApi.PurchaseOrder) {
  return requestClient.put('/erp/purchase-order/update', data);
}

/** 更新采购订单的状态 */
export function updatePurchaseOrderStatus(id: number, status: number) {
  return requestClient.put('/erp/purchase-order/update-status', null, {
    params: { id, status },
  });
}

/** 删除采购订单 */
export function deletePurchaseOrder(id: number) {
  return requestClient.delete(`/erp/purchase-order/delete?id=${id}`);
}

/** 批量删除采购订单 */
export function deletePurchaseOrderList(ids: number[]) {
  return requestClient.delete('/erp/purchase-order/delete', {
    params: { ids: ids.join(',') },
  });
}

/** 导出采购订单 Excel */
export function exportPurchaseOrder(params: any) {
  return requestClient.download('/erp/purchase-order/export-excel', { params });
}
