import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmStockTakingPlanParamApi {
  /** 盘点方案条件 */
  export interface StockTakingPlanParam {
    id?: number; // 条件编号
    planId?: number; // 方案编号
    type?: number; // 条件类型
    valueId?: number; // 条件值编号
    valueCode?: string; // 条件值编码
    valueName?: string; // 条件值名称
    remark?: string; // 备注
  }
}

/** 查询盘点方案条件分页 */
export function getStockTakingPlanParamPage(params: PageParam) {
  return requestClient.get<
    PageResult<MesWmStockTakingPlanParamApi.StockTakingPlanParam>
  >('/mes/wm/stocktaking-plan-param/page', { params });
}

/** 查询盘点方案条件详情 */
export function getStockTakingPlanParam(id: number) {
  return requestClient.get<MesWmStockTakingPlanParamApi.StockTakingPlanParam>(
    `/mes/wm/stocktaking-plan-param/get?id=${id}`,
  );
}

/** 新增盘点方案条件 */
export function createStockTakingPlanParam(
  data: MesWmStockTakingPlanParamApi.StockTakingPlanParam,
) {
  return requestClient.post('/mes/wm/stocktaking-plan-param/create', data);
}

/** 修改盘点方案条件 */
export function updateStockTakingPlanParam(
  data: MesWmStockTakingPlanParamApi.StockTakingPlanParam,
) {
  return requestClient.put('/mes/wm/stocktaking-plan-param/update', data);
}

/** 删除盘点方案条件 */
export function deleteStockTakingPlanParam(id: number) {
  return requestClient.delete(`/mes/wm/stocktaking-plan-param/delete?id=${id}`);
}
