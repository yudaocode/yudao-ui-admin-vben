import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmProductSalesApi {
  /** MES 销售出库单 */
  export interface ProductSales {
    id?: number; // 出库单编号
    code?: string; // 出库单编号
    name?: string; // 出库单名称
    noticeId?: number; // 发货通知单编号
    noticeCode?: string; // 发货通知单编码
    clientId?: number; // 客户编号
    clientCode?: string; // 客户编码
    clientName?: string; // 客户名称
    salesOrderCode?: string; // 销售订单编号
    salesDate?: number; // 出库日期
    contactName?: string; // 收货人
    contactTelephone?: string; // 联系方式
    contactAddress?: string; // 收货地址
    carrier?: string; // 承运商
    shippingNumber?: string; // 运输单号
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询销售出库单分页 */
export function getProductSalesPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmProductSalesApi.ProductSales>>(
    '/mes/wm/product-sales/page',
    { params },
  );
}

/** 查询销售出库单详情 */
export function getProductSales(id: number) {
  return requestClient.get<MesWmProductSalesApi.ProductSales>(
    `/mes/wm/product-sales/get?id=${id}`,
  );
}

/** 新增销售出库单 */
export function createProductSales(data: MesWmProductSalesApi.ProductSales) {
  return requestClient.post<number>('/mes/wm/product-sales/create', data);
}

/** 修改销售出库单 */
export function updateProductSales(data: MesWmProductSalesApi.ProductSales) {
  return requestClient.put('/mes/wm/product-sales/update', data);
}

/** 删除销售出库单 */
export function deleteProductSales(id: number) {
  return requestClient.delete(`/mes/wm/product-sales/delete?id=${id}`);
}

/** 提交销售出库单 */
export function submitProductSales(id: number) {
  return requestClient.put(`/mes/wm/product-sales/submit?id=${id}`);
}

/** 执行拣货 */
export function stockProductSales(id: number) {
  return requestClient.put(`/mes/wm/product-sales/stock?id=${id}`);
}

/** 填写运单 */
export function shippingProductSales(data: MesWmProductSalesApi.ProductSales) {
  return requestClient.put('/mes/wm/product-sales/shipping', data);
}

/** 执行出库 */
export function finishProductSales(id: number) {
  return requestClient.put(`/mes/wm/product-sales/finish?id=${id}`);
}

/** 取消销售出库单 */
export function cancelProductSales(id: number) {
  return requestClient.put(`/mes/wm/product-sales/cancel?id=${id}`);
}

/** 校验销售出库单拣货数量是否与出库数量一致 */
export function checkProductSalesQuantity(id: number) {
  return requestClient.get<boolean>(
    `/mes/wm/product-sales/check-quantity?id=${id}`,
  );
}

/** 导出销售出库单 */
export function exportProductSales(params: any) {
  return requestClient.download('/mes/wm/product-sales/export-excel', {
    params,
  });
}
