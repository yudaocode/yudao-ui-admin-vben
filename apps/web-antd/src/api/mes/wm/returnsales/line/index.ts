import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmReturnSalesLineApi {
  /** MES 销售退货单行 */
  export interface ReturnSalesLine {
    id?: number; // 行编号
    returnId?: number; // 退货单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    quantity?: number; // 退货数量
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    rqcCheckFlag?: boolean; // 是否需要质检
    rqcId?: number; // 退货检验单编号
    qualityStatus?: number; // 质量状态
    remark?: string; // 备注
  }
}

/** 查询销售退货单行分页 */
export function getReturnSalesLinePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmReturnSalesLineApi.ReturnSalesLine>>(
    '/mes/wm/return-sales-line/page',
    { params },
  );
}

/** 查询销售退货单行详情 */
export function getReturnSalesLine(id: number) {
  return requestClient.get<MesWmReturnSalesLineApi.ReturnSalesLine>(
    `/mes/wm/return-sales-line/get?id=${id}`,
  );
}

/** 新增销售退货单行 */
export function createReturnSalesLine(
  data: MesWmReturnSalesLineApi.ReturnSalesLine,
) {
  return requestClient.post<number>('/mes/wm/return-sales-line/create', data);
}

/** 修改销售退货单行 */
export function updateReturnSalesLine(
  data: MesWmReturnSalesLineApi.ReturnSalesLine,
) {
  return requestClient.put('/mes/wm/return-sales-line/update', data);
}

/** 删除销售退货单行 */
export function deleteReturnSalesLine(id: number) {
  return requestClient.delete(`/mes/wm/return-sales-line/delete?id=${id}`);
}
