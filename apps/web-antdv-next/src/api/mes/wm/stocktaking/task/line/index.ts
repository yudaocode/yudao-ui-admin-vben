import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmStockTakingTaskLineApi {
  /** 盘点任务行 */
  export interface StockTakingTaskLine {
    id?: number; // 盘点行编号
    taskId?: number; // 任务编号
    materialStockId?: number; // 库存编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 计量单位名称
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    quantity?: number; // 在库数量
    takingQuantity?: number; // 盘点数量
    differenceQuantity?: number; // 差异数量
    warehouseId?: number; // 仓库编号
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationName?: string; // 库区名称
    areaId?: number; // 库位编号
    areaName?: string; // 库位名称
    status?: number; // 状态
    remark?: string; // 备注
  }
}

/** 查询盘点任务行分页 */
export function getStockTakingTaskLinePage(params: PageParam) {
  return requestClient.get<
    PageResult<MesWmStockTakingTaskLineApi.StockTakingTaskLine>
  >('/mes/wm/stocktaking-task-line/page', { params });
}

/** 查询盘点任务行精简列表 */
export function getStockTakingTaskLineSimpleList(taskId: number) {
  return requestClient.get<MesWmStockTakingTaskLineApi.StockTakingTaskLine[]>(
    '/mes/wm/stocktaking-task-line/simple-list',
    { params: { taskId } },
  );
}

/** 查询盘点任务行详情 */
export function getStockTakingTaskLine(id: number) {
  return requestClient.get<MesWmStockTakingTaskLineApi.StockTakingTaskLine>(
    '/mes/wm/stocktaking-task-line/get',
    { params: { id } },
  );
}

/** 新增盘点任务行 */
export function createStockTakingTaskLine(
  data: MesWmStockTakingTaskLineApi.StockTakingTaskLine,
) {
  return requestClient.post('/mes/wm/stocktaking-task-line/create', data);
}

/** 修改盘点任务行 */
export function updateStockTakingTaskLine(
  data: MesWmStockTakingTaskLineApi.StockTakingTaskLine,
) {
  return requestClient.put('/mes/wm/stocktaking-task-line/update', data);
}

/** 删除盘点任务行 */
export function deleteStockTakingTaskLine(id: number) {
  return requestClient.delete(`/mes/wm/stocktaking-task-line/delete?id=${id}`);
}
