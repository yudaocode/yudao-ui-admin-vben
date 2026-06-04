import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmMiscIssueLineApi {
  /** MES 杂项出库单行 */
  export interface MiscIssueLine {
    id?: number; // 编号
    issueId?: number; // 出库单编号
    sourceDocLineId?: number; // 来源单据行编号
    materialStockId?: number; // 库存编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasure?: string; // 计量单位
    unitMeasureName?: string; // 计量单位名称
    quantity?: number; // 出库数量
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    warehouseId?: number; // 仓库编号
    warehouseCode?: string; // 仓库编码
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationCode?: string; // 库区编码
    locationName?: string; // 库区名称
    areaId?: number; // 库位编号
    areaCode?: string; // 库位编码
    areaName?: string; // 库位名称
    remark?: string; // 备注
    quantityMax?: number; // 可出库最大数量（前端用于限制出库数量，取自库存在库数量）
  }
}

/** 查询杂项出库单行分页 */
export function getMiscIssueLinePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmMiscIssueLineApi.MiscIssueLine>>(
    '/mes/wm/misc-issue-line/page',
    { params },
  );
}

/** 查询杂项出库单行列表 */
export function getMiscIssueLineListByIssueId(issueId: number) {
  return requestClient.get<MesWmMiscIssueLineApi.MiscIssueLine[]>(
    `/mes/wm/misc-issue-line/list-by-issue-id?issueId=${issueId}`,
  );
}

/** 查询杂项出库单行详情 */
export function getMiscIssueLine(id: number) {
  return requestClient.get<MesWmMiscIssueLineApi.MiscIssueLine>(
    `/mes/wm/misc-issue-line/get?id=${id}`,
  );
}

/** 新增杂项出库单行 */
export function createMiscIssueLine(data: MesWmMiscIssueLineApi.MiscIssueLine) {
  return requestClient.post('/mes/wm/misc-issue-line/create', data);
}

/** 修改杂项出库单行 */
export function updateMiscIssueLine(data: MesWmMiscIssueLineApi.MiscIssueLine) {
  return requestClient.put('/mes/wm/misc-issue-line/update', data);
}

/** 删除杂项出库单行 */
export function deleteMiscIssueLine(id: number) {
  return requestClient.delete(`/mes/wm/misc-issue-line/delete?id=${id}`);
}
