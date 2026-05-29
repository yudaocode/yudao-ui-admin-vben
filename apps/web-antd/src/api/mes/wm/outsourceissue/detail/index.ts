import { requestClient } from '#/api/request';

export namespace MesWmOutsourceIssueDetailApi {
  /** MES 外协发料单明细 */
  export interface OutsourceIssueDetail {
    id?: number; // 明细编号
    lineId?: number; // 行编号
    issueId?: number; // 发料单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 计量单位名称
    quantity?: number; // 数量
    materialStockId?: number; // 库存编号
    batchId?: number; // 批次编号
    batchCode?: string; // 批次编码
    warehouseId?: number; // 仓库编号
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationName?: string; // 库区名称
    areaId?: number; // 库位编号
    areaName?: string; // 库位名称
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询外协发料单明细列表 */
export function getOutsourceIssueDetailListByLineId(lineId: number) {
  return requestClient.get<
    MesWmOutsourceIssueDetailApi.OutsourceIssueDetail[]
  >('/mes/wm/outsource-issue-detail/list-by-line', { params: { lineId } });
}

/** 查询外协发料单明细详情 */
export function getOutsourceIssueDetail(id: number) {
  return requestClient.get<MesWmOutsourceIssueDetailApi.OutsourceIssueDetail>(
    `/mes/wm/outsource-issue-detail/get?id=${id}`,
  );
}

/** 新增外协发料单明细 */
export function createOutsourceIssueDetail(
  data: MesWmOutsourceIssueDetailApi.OutsourceIssueDetail,
) {
  return requestClient.post('/mes/wm/outsource-issue-detail/create', data);
}

/** 修改外协发料单明细 */
export function updateOutsourceIssueDetail(
  data: MesWmOutsourceIssueDetailApi.OutsourceIssueDetail,
) {
  return requestClient.put('/mes/wm/outsource-issue-detail/update', data);
}

/** 删除外协发料单明细 */
export function deleteOutsourceIssueDetail(id: number) {
  return requestClient.delete(`/mes/wm/outsource-issue-detail/delete?id=${id}`);
}
