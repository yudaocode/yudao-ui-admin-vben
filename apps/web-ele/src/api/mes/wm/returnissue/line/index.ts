import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmReturnIssueLineApi {
  /** MES 生产退料单行 */
  export interface ReturnIssueLine {
    id?: number; // 行编号
    issueId?: number; // 退料单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    materialStockId?: number; // 库存记录编号
    quantity?: number; // 退料数量
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    rqcCheckFlag?: boolean; // 是否检测
    qualityStatus?: number; // 质量状态
    rqcId?: number; // 退货检验单编号
    remark?: string; // 备注
  }
}

/** 查询生产退料单行分页 */
export function getReturnIssueLinePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmReturnIssueLineApi.ReturnIssueLine>>(
    '/mes/wm/return-issue-line/page',
    { params },
  );
}

/** 查询生产退料单行详情 */
export function getReturnIssueLine(id: number) {
  return requestClient.get<MesWmReturnIssueLineApi.ReturnIssueLine>(
    `/mes/wm/return-issue-line/get?id=${id}`,
  );
}

/** 新增生产退料单行 */
export function createReturnIssueLine(
  data: MesWmReturnIssueLineApi.ReturnIssueLine,
) {
  return requestClient.post<number>('/mes/wm/return-issue-line/create', data);
}

/** 修改生产退料单行 */
export function updateReturnIssueLine(
  data: MesWmReturnIssueLineApi.ReturnIssueLine,
) {
  return requestClient.put('/mes/wm/return-issue-line/update', data);
}

/** 删除生产退料单行 */
export function deleteReturnIssueLine(id: number) {
  return requestClient.delete(`/mes/wm/return-issue-line/delete?id=${id}`);
}
