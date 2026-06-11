import { requestClient } from '#/api/request';

export namespace MesWmProductReceiptDetailApi {
  /** MES 产品入库明细 */
  export interface ProductReceiptDetail {
    id?: number; // 明细编号
    lineId?: number; // 入库单行编号
    receiptId?: number; // 入库单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    quantity?: number; // 数量
    batchId?: number; // 批次编号
    warehouseId?: number; // 仓库编号
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationName?: string; // 库区名称
    areaId?: number; // 库位编号
    areaName?: string; // 库位名称
    remark?: string; // 备注
  }
}

/** 查询产品入库明细列表（按行编号） */
export function getProductReceiptDetailListByLineId(lineId: number) {
  return requestClient.get<MesWmProductReceiptDetailApi.ProductReceiptDetail[]>(
    '/mes/wm/product-receipt-detail/list-by-line',
    { params: { lineId } },
  );
}

/** 查询产品入库明细详情 */
export function getProductReceiptDetail(id: number) {
  return requestClient.get<MesWmProductReceiptDetailApi.ProductReceiptDetail>(
    `/mes/wm/product-receipt-detail/get?id=${id}`,
  );
}

/** 新增产品入库明细 */
export function createProductReceiptDetail(
  data: MesWmProductReceiptDetailApi.ProductReceiptDetail,
) {
  return requestClient.post<number>(
    '/mes/wm/product-receipt-detail/create',
    data,
  );
}

/** 修改产品入库明细 */
export function updateProductReceiptDetail(
  data: MesWmProductReceiptDetailApi.ProductReceiptDetail,
) {
  return requestClient.put('/mes/wm/product-receipt-detail/update', data);
}

/** 删除产品入库明细 */
export function deleteProductReceiptDetail(id: number) {
  return requestClient.delete(`/mes/wm/product-receipt-detail/delete?id=${id}`);
}
