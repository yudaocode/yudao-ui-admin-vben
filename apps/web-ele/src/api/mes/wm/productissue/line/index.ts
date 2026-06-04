import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmProductIssueLineApi {
  /** MES 领料出库单行 */
  export interface ProductIssueLine {
    id?: number; // 行编号
    issueId?: number; // 领料单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    quantity?: number; // 领料数量
    batchId?: number; // 批次编号
    remark?: string; // 备注
  }
}

/** 查询领料出库单行分页 */
export function getProductIssueLinePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmProductIssueLineApi.ProductIssueLine>>(
    '/mes/wm/product-issue-line/page',
    { params },
  );
}

/** 查询领料出库单行详情 */
export function getProductIssueLine(id: number) {
  return requestClient.get<MesWmProductIssueLineApi.ProductIssueLine>(
    `/mes/wm/product-issue-line/get?id=${id}`,
  );
}

/** 新增领料出库单行 */
export function createProductIssueLine(
  data: MesWmProductIssueLineApi.ProductIssueLine,
) {
  return requestClient.post<number>('/mes/wm/product-issue-line/create', data);
}

/** 修改领料出库单行 */
export function updateProductIssueLine(
  data: MesWmProductIssueLineApi.ProductIssueLine,
) {
  return requestClient.put('/mes/wm/product-issue-line/update', data);
}

/** 删除领料出库单行 */
export function deleteProductIssueLine(id: number) {
  return requestClient.delete(`/mes/wm/product-issue-line/delete?id=${id}`);
}
