import { requestClient } from '#/api/request';

export namespace MesWmProductSalesDetailApi {
  /** MES 销售出库明细 */
  export interface ProductSalesDetail {
    id?: number; // 明细编号
    lineId?: number; // 出库单行编号
    salesId?: number; // 出库单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    quantity?: number; // 数量
    materialStockId?: number; // 库存记录编号
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    warehouseId?: number; // 仓库编号
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationName?: string; // 库区名称
    areaId?: number; // 库位编号
    areaName?: string; // 库位名称
    remark?: string; // 备注
  }
}

/** 查询销售出库明细列表（按行编号） */
export function getProductSalesDetailListByLineId(lineId: number) {
  return requestClient.get<MesWmProductSalesDetailApi.ProductSalesDetail[]>(
    '/mes/wm/product-sales-detail/list-by-line',
    { params: { lineId } },
  );
}

/** 查询销售出库明细详情 */
export function getProductSalesDetail(id: number) {
  return requestClient.get<MesWmProductSalesDetailApi.ProductSalesDetail>(
    `/mes/wm/product-sales-detail/get?id=${id}`,
  );
}

/** 新增销售出库明细 */
export function createProductSalesDetail(
  data: MesWmProductSalesDetailApi.ProductSalesDetail,
) {
  return requestClient.post<number>('/mes/wm/product-sales-detail/create', data);
}

/** 修改销售出库明细 */
export function updateProductSalesDetail(
  data: MesWmProductSalesDetailApi.ProductSalesDetail,
) {
  return requestClient.put('/mes/wm/product-sales-detail/update', data);
}

/** 删除销售出库明细 */
export function deleteProductSalesDetail(id: number) {
  return requestClient.delete(`/mes/wm/product-sales-detail/delete?id=${id}`);
}
