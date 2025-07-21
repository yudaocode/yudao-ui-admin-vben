import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ErpPurchaseOrderApi {
  /** ERP 采购订单信息 */
  export interface PurchaseOrder {
    id?: number; // 订单工单编号
    no: string; // 采购订单号
    supplierId: number; // 供应商编号
    orderTime: Date; // 订单时间
    totalCount: number; // 合计数量
    totalPrice: number; // 合计金额，单位：元
    status: number; // 状态
    remark: string; // 备注
    inCount: number; // 采购入库数量
    returnCount: number; // 采购退货数量
  }

  /** 采购订单分页查询参数 */
  export interface PurchaseOrderPageParam extends PageParam {
    no?: string;
    supplierId?: number;
    status?: number;
  }
}

/** 查询采购订单分页 */
export function getPurchaseOrderPage(
  params: ErpPurchaseOrderApi.PurchaseOrderPageParam,
) {
  return requestClient.get<PageResult<ErpPurchaseOrderApi.PurchaseOrder>>(
    '/erp/purchase-order/page',
    { params },
  );
}

/** 查询采购订单详情 */
export function getPurchaseOrder(id: number) {
  return requestClient.get<ErpPurchaseOrderApi.PurchaseOrder>(
    `/erp/purchase-order/get?id=${id}`,
  );
}

/** 新增采购订单 */
export function createPurchaseOrder(data: ErpPurchaseOrderApi.PurchaseOrder) {
  return requestClient.post('/erp/purchase-order/create', data);
}

/** 修改采购订单 */
export function updatePurchaseOrder(data: ErpPurchaseOrderApi.PurchaseOrder) {
  return requestClient.put('/erp/purchase-order/update', data);
}

/** 更新采购订单的状态 */
export function updatePurchaseOrderStatus(id: number, status: number) {
  return requestClient.put('/erp/purchase-order/update-status', null, {
    params: { id, status },
  });
}

/** 删除采购订单 */
export function deletePurchaseOrder(ids: number[]) {
  return requestClient.delete('/erp/purchase-order/delete', {
    params: { ids: ids.join(',') },
  });
}

/** 导出采购订单 Excel */
export function exportPurchaseOrder(params: any) {
  return requestClient.download('/erp/purchase-order/export-excel', { params });
}
