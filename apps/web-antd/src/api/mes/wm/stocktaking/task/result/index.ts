import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmStockTakingResultApi {
  /** 盘点结果 */
  export interface StockTakingResult {
    id?: number; // 结果编号
    taskId?: number; // 任务编号
    lineId?: number; // 盘点行编号
    materialStockId?: number; // 库存编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 计量单位名称
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    warehouseId?: number; // 仓库编号
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationName?: string; // 库区名称
    areaId?: number; // 库位编号
    areaName?: string; // 库位名称
    quantity?: number; // 在库数量
    takingQuantity?: number; // 盘点数量
    remark?: string; // 备注
    createTime?: string; // 创建时间
  }
}

/** 查询盘点结果分页 */
export function getStockTakingResultPage(params: PageParam) {
  return requestClient.get<
    PageResult<MesWmStockTakingResultApi.StockTakingResult>
  >('/mes/wm/stocktaking-task-result/page', { params });
}

/** 查询盘点结果详情 */
export function getStockTakingResult(id: number) {
  return requestClient.get<MesWmStockTakingResultApi.StockTakingResult>(
    '/mes/wm/stocktaking-task-result/get',
    { params: { id } },
  );
}

/** 新增盘点结果 */
export function createStockTakingResult(
  data: MesWmStockTakingResultApi.StockTakingResult,
) {
  return requestClient.post('/mes/wm/stocktaking-task-result/create', data);
}

/** 修改盘点结果 */
export function updateStockTakingResult(
  data: MesWmStockTakingResultApi.StockTakingResult,
) {
  return requestClient.put('/mes/wm/stocktaking-task-result/update', data);
}

/** 删除盘点结果 */
export function deleteStockTakingResult(id: number) {
  return requestClient.delete(`/mes/wm/stocktaking-task-result/delete?id=${id}`);
}
