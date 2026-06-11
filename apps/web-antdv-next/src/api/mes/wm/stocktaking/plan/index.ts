import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmStockTakingPlanApi {
  /** 盘点方案 */
  export interface StockTakingPlan {
    id?: number; // 方案编号
    code?: string; // 方案编码
    name?: string; // 方案名称
    type?: number; // 盘点类型
    startTime?: number; // 开始时间
    endTime?: number; // 结束时间
    blindFlag?: boolean; // 是否盲盘
    frozen?: boolean; // 是否冻结库存
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: string; // 创建时间
  }
}

/** 查询盘点方案分页 */
export function getStockTakingPlanPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmStockTakingPlanApi.StockTakingPlan>>(
    '/mes/wm/stocktaking-plan/page',
    { params },
  );
}

/** 查询盘点方案详情 */
export function getStockTakingPlan(id: number) {
  return requestClient.get<MesWmStockTakingPlanApi.StockTakingPlan>(
    `/mes/wm/stocktaking-plan/get?id=${id}`,
  );
}

/** 新增盘点方案 */
export function createStockTakingPlan(
  data: MesWmStockTakingPlanApi.StockTakingPlan,
) {
  return requestClient.post<number>('/mes/wm/stocktaking-plan/create', data);
}

/** 修改盘点方案 */
export function updateStockTakingPlan(
  data: MesWmStockTakingPlanApi.StockTakingPlan,
) {
  return requestClient.put('/mes/wm/stocktaking-plan/update', data);
}

/** 修改盘点方案状态 */
export function updateStockTakingPlanStatus(id: number, status: number) {
  return requestClient.put('/mes/wm/stocktaking-plan/update-status', null, {
    params: { id, status },
  });
}

/** 删除盘点方案 */
export function deleteStockTakingPlan(id: number) {
  return requestClient.delete(`/mes/wm/stocktaking-plan/delete?id=${id}`);
}

/** 导出盘点方案 */
export function exportStockTakingPlan(params: any) {
  return requestClient.download('/mes/wm/stocktaking-plan/export-excel', {
    params,
  });
}
