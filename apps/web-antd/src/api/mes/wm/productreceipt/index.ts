import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmProductReceiptApi {
  /** MES 产品入库单 */
  export interface ProductReceipt {
    id?: number; // 入库单编号
    code?: string; // 入库单编码
    name?: string; // 入库单名称
    workOrderId?: number; // 生产工单编号
    workOrderCode?: string; // 生产工单编码
    itemId?: number; // 产品物料编号
    itemCode?: string; // 产品物料编码
    itemName?: string; // 产品物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    receiptDate?: number; // 入库日期
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询产品入库单分页 */
export function getProductReceiptPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmProductReceiptApi.ProductReceipt>>(
    '/mes/wm/product-receipt/page',
    { params },
  );
}

/** 查询产品入库单详情 */
export function getProductReceipt(id: number) {
  return requestClient.get<MesWmProductReceiptApi.ProductReceipt>(
    `/mes/wm/product-receipt/get?id=${id}`,
  );
}

/** 新增产品入库单 */
export function createProductReceipt(
  data: MesWmProductReceiptApi.ProductReceipt,
) {
  return requestClient.post<number>('/mes/wm/product-receipt/create', data);
}

/** 修改产品入库单 */
export function updateProductReceipt(
  data: MesWmProductReceiptApi.ProductReceipt,
) {
  return requestClient.put('/mes/wm/product-receipt/update', data);
}

/** 删除产品入库单 */
export function deleteProductReceipt(id: number) {
  return requestClient.delete(`/mes/wm/product-receipt/delete?id=${id}`);
}

/** 提交产品入库单 */
export function submitProductReceipt(id: number) {
  return requestClient.put(`/mes/wm/product-receipt/submit?id=${id}`);
}

/** 执行上架 */
export function stockProductReceipt(id: number) {
  return requestClient.put(`/mes/wm/product-receipt/stock?id=${id}`);
}

/** 执行入库 */
export function finishProductReceipt(id: number) {
  return requestClient.put(`/mes/wm/product-receipt/finish?id=${id}`);
}

/** 取消产品入库单 */
export function cancelProductReceipt(id: number) {
  return requestClient.put(`/mes/wm/product-receipt/cancel?id=${id}`);
}

/** 校验产品入库单明细数量是否与行收货数量一致 */
export function checkProductReceiptQuantity(id: number) {
  return requestClient.get<boolean>(
    `/mes/wm/product-receipt/check-quantity?id=${id}`,
  );
}

/** 导出产品入库单 */
export function exportProductReceipt(params: any) {
  return requestClient.download('/mes/wm/product-receipt/export-excel', {
    params,
  });
}
