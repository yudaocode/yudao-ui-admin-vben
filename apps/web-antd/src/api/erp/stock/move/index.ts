import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

namespace ErpStockMoveApi {
  /** 库存调拨单信息 */
  export interface StockMove {
    id?: number; // 调拨编号
    no: string; // 调拨单号
    outTime: Date; // 调拨时间
    totalCount: number; // 合计数量
    totalPrice: number; // 合计金额，单位：元
    status: number; // 状态
    remark: string; // 备注
  }

  /** 库存调拨单分页查询参数 */
  export interface StockMovePageParams extends PageParam {
    no?: string;
    status?: number;
  }

  /** 库存调拨单状态更新参数 */
  export interface StockMoveStatusParams {
    id: number;
    status: number;
  }
}

/**
 * 查询库存调拨单分页
 */
export function getStockMovePage(params: ErpStockMoveApi.StockMovePageParams) {
  return requestClient.get<PageResult<ErpStockMoveApi.StockMove>>(
    '/erp/stock-move/page',
    {
      params,
    },
  );
}

/**
 * 查询库存调拨单详情
 */
export function getStockMove(id: number) {
  return requestClient.get<ErpStockMoveApi.StockMove>(
    `/erp/stock-move/get?id=${id}`,
  );
}

/**
 * 新增库存调拨单
 */
export function createStockMove(data: ErpStockMoveApi.StockMove) {
  return requestClient.post('/erp/stock-move/create', data);
}

/**
 * 修改库存调拨单
 */
export function updateStockMove(data: ErpStockMoveApi.StockMove) {
  return requestClient.put('/erp/stock-move/update', data);
}

/**
 * 更新库存调拨单的状态
 */
export function updateStockMoveStatus(
  params: ErpStockMoveApi.StockMoveStatusParams,
) {
  return requestClient.put('/erp/stock-move/update-status', null, {
    params,
  });
}

/**
 * 删除库存调拨单
 */
export function deleteStockMove(ids: number[]) {
  return requestClient.delete('/erp/stock-move/delete', {
    params: {
      ids: ids.join(','),
    },
  });
}

/**
 * 导出库存调拨单 Excel
 */
export function exportStockMove(params: ErpStockMoveApi.StockMovePageParams) {
  return requestClient.download('/erp/stock-move/export-excel', {
    params,
  });
}
