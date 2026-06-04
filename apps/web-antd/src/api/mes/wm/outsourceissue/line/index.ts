import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmOutsourceIssueLineApi {
  /** MES 外协发料单行 */
  export interface OutsourceIssueLine {
    id?: number; // 行编号
    issueId?: number; // 发料单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 计量单位名称
    quantity?: number; // 发料数量
    materialStockId?: number; // 库存编号
    batchId?: number; // 批次编号
    batchCode?: string; // 批次编码
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询外协发料单行分页 */
export function getOutsourceIssueLinePage(params: PageParam) {
  return requestClient.get<
    PageResult<MesWmOutsourceIssueLineApi.OutsourceIssueLine>
  >('/mes/wm/outsource-issue-line/page', { params });
}

/** 查询外协发料单行详情 */
export function getOutsourceIssueLine(id: number) {
  return requestClient.get<MesWmOutsourceIssueLineApi.OutsourceIssueLine>(
    `/mes/wm/outsource-issue-line/get?id=${id}`,
  );
}

/** 新增外协发料单行 */
export function createOutsourceIssueLine(
  data: MesWmOutsourceIssueLineApi.OutsourceIssueLine,
) {
  return requestClient.post('/mes/wm/outsource-issue-line/create', data);
}

/** 修改外协发料单行 */
export function updateOutsourceIssueLine(
  data: MesWmOutsourceIssueLineApi.OutsourceIssueLine,
) {
  return requestClient.put('/mes/wm/outsource-issue-line/update', data);
}

/** 删除外协发料单行 */
export function deleteOutsourceIssueLine(id: number) {
  return requestClient.delete(`/mes/wm/outsource-issue-line/delete?id=${id}`);
}
