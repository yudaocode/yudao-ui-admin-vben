import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmStockTakingTaskApi {
  /** 盘点任务 */
  export interface StockTakingTask {
    id?: number; // 任务编号
    code?: string; // 任务编码
    name?: string; // 任务名称
    takingDate?: string; // 盘点日期
    type?: number; // 盘点类型
    userId?: number; // 盘点人用户编号
    userNickname?: string; // 盘点人名称
    planId?: number; // 盘点方案编号
    planCode?: string; // 盘点方案编码
    planName?: string; // 盘点方案名称
    blindFlag?: boolean; // 是否盲盘
    frozen?: boolean; // 是否冻结库存
    startTime?: number; // 开始时间
    endTime?: number; // 结束时间
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: string; // 创建时间
  }
}

/** 查询盘点任务分页 */
export function getStockTakingPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmStockTakingTaskApi.StockTakingTask>>(
    '/mes/wm/stocktaking-task/page',
    { params },
  );
}

/** 查询盘点任务详情 */
export function getStockTaking(id: number) {
  return requestClient.get<MesWmStockTakingTaskApi.StockTakingTask>(
    `/mes/wm/stocktaking-task/get?id=${id}`,
  );
}

/** 新增盘点任务 */
export function createStockTaking(
  data: MesWmStockTakingTaskApi.StockTakingTask,
) {
  return requestClient.post<number>('/mes/wm/stocktaking-task/create', data);
}

/** 修改盘点任务 */
export function updateStockTaking(
  data: MesWmStockTakingTaskApi.StockTakingTask,
) {
  return requestClient.put('/mes/wm/stocktaking-task/update', data);
}

/** 删除盘点任务 */
export function deleteStockTaking(id: number) {
  return requestClient.delete(`/mes/wm/stocktaking-task/delete?id=${id}`);
}

/** 提交盘点任务 */
export function submitStockTaking(id: number) {
  return requestClient.put('/mes/wm/stocktaking-task/submit', null, {
    params: { id },
  });
}

/** 取消盘点任务 */
export function cancelStockTaking(id: number) {
  return requestClient.put('/mes/wm/stocktaking-task/cancel', null, {
    params: { id },
  });
}

/** 执行盘点任务 */
export function finishStockTaking(id: number) {
  return requestClient.put('/mes/wm/stocktaking-task/finish', { id });
}

/** 导出盘点任务 */
export function exportStockTaking(params: any) {
  return requestClient.download('/mes/wm/stocktaking-task/export-excel', {
    params,
  });
}
