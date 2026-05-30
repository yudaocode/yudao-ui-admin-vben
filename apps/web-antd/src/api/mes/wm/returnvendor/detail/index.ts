import { requestClient } from '#/api/request';

export namespace MesWmReturnVendorDetailApi {
  /** MES 供应商退货明细 */
  export interface ReturnVendorDetail {
    id?: number; // 明细编号
    returnId?: number; // 退货单编号
    lineId?: number; // 退货单行编号
    materialStockId?: number; // 库存记录编号
    itemId?: number; // 物料编号
    quantity?: number; // 数量
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

/** 查询供应商退货明细列表（按行编号） */
export function getReturnVendorDetailListByLineId(lineId: number) {
  return requestClient.get<MesWmReturnVendorDetailApi.ReturnVendorDetail[]>(
    '/mes/wm/return-vendor-detail/list-by-line',
    { params: { lineId } },
  );
}

/** 查询供应商退货明细详情 */
export function getReturnVendorDetail(id: number) {
  return requestClient.get<MesWmReturnVendorDetailApi.ReturnVendorDetail>(
    `/mes/wm/return-vendor-detail/get?id=${id}`,
  );
}

/** 新增供应商退货明细 */
export function createReturnVendorDetail(
  data: MesWmReturnVendorDetailApi.ReturnVendorDetail,
) {
  return requestClient.post<number>('/mes/wm/return-vendor-detail/create', data);
}

/** 修改供应商退货明细 */
export function updateReturnVendorDetail(
  data: MesWmReturnVendorDetailApi.ReturnVendorDetail,
) {
  return requestClient.put('/mes/wm/return-vendor-detail/update', data);
}

/** 删除供应商退货明细 */
export function deleteReturnVendorDetail(id: number) {
  return requestClient.delete(`/mes/wm/return-vendor-detail/delete?id=${id}`);
}
