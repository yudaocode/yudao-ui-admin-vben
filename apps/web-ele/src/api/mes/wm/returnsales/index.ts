import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmReturnSalesApi {
  /** MES 销售退货单 */
  export interface ReturnSales {
    id?: number; // 退货单编号
    code?: string; // 退货单编号
    name?: string; // 退货单名称
    salesOrderCode?: string; // 销售订单号
    clientId?: number; // 客户编号
    clientCode?: string; // 客户编码
    clientName?: string; // 客户名称
    returnDate?: number; // 退货日期
    returnReason?: string; // 退货原因
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询销售退货单分页 */
export function getReturnSalesPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmReturnSalesApi.ReturnSales>>(
    '/mes/wm/return-sales/page',
    { params },
  );
}

/** 查询销售退货单详情 */
export function getReturnSales(id: number) {
  return requestClient.get<MesWmReturnSalesApi.ReturnSales>(
    `/mes/wm/return-sales/get?id=${id}`,
  );
}

/** 新增销售退货单 */
export function createReturnSales(data: MesWmReturnSalesApi.ReturnSales) {
  return requestClient.post<number>('/mes/wm/return-sales/create', data);
}

/** 修改销售退货单 */
export function updateReturnSales(data: MesWmReturnSalesApi.ReturnSales) {
  return requestClient.put('/mes/wm/return-sales/update', data);
}

/** 删除销售退货单 */
export function deleteReturnSales(id: number) {
  return requestClient.delete(`/mes/wm/return-sales/delete?id=${id}`);
}

/** 提交销售退货单 */
export function submitReturnSales(id: number) {
  return requestClient.put(`/mes/wm/return-sales/submit?id=${id}`);
}

/** 执行退货 */
export function finishReturnSales(id: number) {
  return requestClient.put(`/mes/wm/return-sales/finish?id=${id}`);
}

/** 执行上架 */
export function stockReturnSales(id: number) {
  return requestClient.put(`/mes/wm/return-sales/stock?id=${id}`);
}

/** 取消销售退货单 */
export function cancelReturnSales(id: number) {
  return requestClient.put(`/mes/wm/return-sales/cancel?id=${id}`);
}

/** 导出销售退货单 */
export function exportReturnSales(params: any) {
  return requestClient.download('/mes/wm/return-sales/export-excel', {
    params,
  });
}
