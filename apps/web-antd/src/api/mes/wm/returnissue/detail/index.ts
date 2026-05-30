import { requestClient } from '#/api/request';

export namespace MesWmReturnIssueDetailApi {
  /** MES 生产退料明细 */
  export interface ReturnIssueDetail {
    id?: number; // 明细编号
    issueId?: number; // 退料单编号
    lineId?: number; // 退料单行编号
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

/** 查询生产退料明细列表（按行编号） */
export function getReturnIssueDetailListByLineId(lineId: number) {
  return requestClient.get<MesWmReturnIssueDetailApi.ReturnIssueDetail[]>(
    '/mes/wm/return-issue-detail/list-by-line',
    { params: { lineId } },
  );
}

/** 查询生产退料明细详情 */
export function getReturnIssueDetail(id: number) {
  return requestClient.get<MesWmReturnIssueDetailApi.ReturnIssueDetail>(
    `/mes/wm/return-issue-detail/get?id=${id}`,
  );
}

/** 新增生产退料明细 */
export function createReturnIssueDetail(
  data: MesWmReturnIssueDetailApi.ReturnIssueDetail,
) {
  return requestClient.post<number>('/mes/wm/return-issue-detail/create', data);
}

/** 修改生产退料明细 */
export function updateReturnIssueDetail(
  data: MesWmReturnIssueDetailApi.ReturnIssueDetail,
) {
  return requestClient.put('/mes/wm/return-issue-detail/update', data);
}

/** 删除生产退料明细 */
export function deleteReturnIssueDetail(id: number) {
  return requestClient.delete(`/mes/wm/return-issue-detail/delete?id=${id}`);
}
