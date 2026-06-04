import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmProductReceiptLineApi {
  /** MES 产品入库单行 */
  export interface ProductReceiptLine {
    id?: number; // 行编号
    receiptId?: number; // 入库单编号
    itemId?: number; // 物料编号
    materialStockId?: number; // 库存记录编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    quantity?: number; // 入库数量
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    remark?: string; // 备注
  }
}

/** 查询产品入库单行分页 */
export function getProductReceiptLinePage(params: PageParam) {
  return requestClient.get<
    PageResult<MesWmProductReceiptLineApi.ProductReceiptLine>
  >('/mes/wm/product-receipt-line/page', { params });
}

/** 查询产品入库单行详情 */
export function getProductReceiptLine(id: number) {
  return requestClient.get<MesWmProductReceiptLineApi.ProductReceiptLine>(
    `/mes/wm/product-receipt-line/get?id=${id}`,
  );
}

/** 新增产品入库单行 */
export function createProductReceiptLine(
  data: MesWmProductReceiptLineApi.ProductReceiptLine,
) {
  return requestClient.post<number>(
    '/mes/wm/product-receipt-line/create',
    data,
  );
}

/** 修改产品入库单行 */
export function updateProductReceiptLine(
  data: MesWmProductReceiptLineApi.ProductReceiptLine,
) {
  return requestClient.put('/mes/wm/product-receipt-line/update', data);
}

/** 删除产品入库单行 */
export function deleteProductReceiptLine(id: number) {
  return requestClient.delete(`/mes/wm/product-receipt-line/delete?id=${id}`);
}
