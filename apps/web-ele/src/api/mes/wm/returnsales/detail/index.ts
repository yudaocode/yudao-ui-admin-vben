import { requestClient } from '#/api/request';

export namespace MesWmReturnSalesDetailApi {
  /** MES 销售退货明细 */
  export interface ReturnSalesDetail {
    id?: number; // 明细编号
    returnId?: number; // 退货单编号
    lineId?: number; // 退货单行编号
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

/** 查询销售退货明细列表（按行编号） */
export function getReturnSalesDetailListByLineId(lineId: number) {
  return requestClient.get<MesWmReturnSalesDetailApi.ReturnSalesDetail[]>(
    '/mes/wm/return-sales-detail/list-by-line',
    { params: { lineId } },
  );
}

/** 查询销售退货明细详情 */
export function getReturnSalesDetail(id: number) {
  return requestClient.get<MesWmReturnSalesDetailApi.ReturnSalesDetail>(
    `/mes/wm/return-sales-detail/get?id=${id}`,
  );
}

/** 新增销售退货明细 */
export function createReturnSalesDetail(
  data: MesWmReturnSalesDetailApi.ReturnSalesDetail,
) {
  return requestClient.post<number>('/mes/wm/return-sales-detail/create', data);
}

/** 修改销售退货明细 */
export function updateReturnSalesDetail(
  data: MesWmReturnSalesDetailApi.ReturnSalesDetail,
) {
  return requestClient.put('/mes/wm/return-sales-detail/update', data);
}

/** 删除销售退货明细 */
export function deleteReturnSalesDetail(id: number) {
  return requestClient.delete(`/mes/wm/return-sales-detail/delete?id=${id}`);
}
