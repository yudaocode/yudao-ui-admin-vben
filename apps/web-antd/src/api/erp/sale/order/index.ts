import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ErpSaleOrderApi {
  /** ERP 销售订单信息 */
  export interface SaleOrder {
    id?: number; // 订单工单编号
    no: string; // 销售订单号
    customerId: number; // 客户编号
    orderTime: Date; // 订单时间
    totalCount: number; // 合计数量
    totalPrice: number; // 合计金额，单位：元
    status: number; // 状态
    remark: string; // 备注
    outCount: number; // 销售出库数量
    returnCount: number; // 销售退货数量
  }

  /** 销售订单分页查询参数 */
  export interface SaleOrderPageParam extends PageParam {
    no?: string;
    customerId?: number;
    status?: number;
  }
}

/** 查询销售订单分页 */
export function getSaleOrderPage(params: ErpSaleOrderApi.SaleOrderPageParam) {
  return requestClient.get<PageResult<ErpSaleOrderApi.SaleOrder>>(
    '/erp/sale-order/page',
    { params },
  );
}

/** 查询销售订单详情 */
export function getSaleOrder(id: number) {
  return requestClient.get<ErpSaleOrderApi.SaleOrder>(
    `/erp/sale-order/get?id=${id}`,
  );
}

/** 新增销售订单 */
export function createSaleOrder(data: ErpSaleOrderApi.SaleOrder) {
  return requestClient.post('/erp/sale-order/create', data);
}

/** 修改销售订单 */
export function updateSaleOrder(data: ErpSaleOrderApi.SaleOrder) {
  return requestClient.put('/erp/sale-order/update', data);
}

/** 更新销售订单的状态 */
export function updateSaleOrderStatus(id: number, status: number) {
  return requestClient.put('/erp/sale-order/update-status', null, {
    params: { id, status },
  });
}

/** 删除销售订单 */
export function deleteSaleOrder(ids: number[]) {
  return requestClient.delete('/erp/sale-order/delete', {
    params: { ids: ids.join(',') },
  });
}

/** 导出销售订单 Excel */
export function exportSaleOrder(params: any) {
  return requestClient.download('/erp/sale-order/export-excel', { params });
}
