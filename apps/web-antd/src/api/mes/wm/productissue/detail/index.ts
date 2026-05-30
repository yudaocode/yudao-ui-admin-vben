import { requestClient } from '#/api/request';

export namespace MesWmProductIssueDetailApi {
  /** MES 领料出库明细 */
  export interface ProductIssueDetail {
    id?: number; // 明细编号
    issueId?: number; // 领料单编号
    lineId?: number; // 领料单行编号
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

/** 查询领料出库明细列表（按行编号） */
export function getProductIssueDetailListByLineId(lineId: number) {
  return requestClient.get<MesWmProductIssueDetailApi.ProductIssueDetail[]>(
    '/mes/wm/product-issue-detail/list-by-line',
    { params: { lineId } },
  );
}

/** 查询领料出库明细详情 */
export function getProductIssueDetail(id: number) {
  return requestClient.get<MesWmProductIssueDetailApi.ProductIssueDetail>(
    `/mes/wm/product-issue-detail/get?id=${id}`,
  );
}

/** 新增领料出库明细 */
export function createProductIssueDetail(
  data: MesWmProductIssueDetailApi.ProductIssueDetail,
) {
  return requestClient.post<number>('/mes/wm/product-issue-detail/create', data);
}

/** 修改领料出库明细 */
export function updateProductIssueDetail(
  data: MesWmProductIssueDetailApi.ProductIssueDetail,
) {
  return requestClient.put('/mes/wm/product-issue-detail/update', data);
}

/** 删除领料出库明细 */
export function deleteProductIssueDetail(id: number) {
  return requestClient.delete(`/mes/wm/product-issue-detail/delete?id=${id}`);
}
