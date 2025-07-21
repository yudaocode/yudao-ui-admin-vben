import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

namespace ErpStockInApi {
  /** 其它入库单信息 */
  export interface StockIn {
    id?: number; // 入库编号
    no: string; // 入库单号
    supplierId: number; // 供应商编号
    inTime: Date; // 入库时间
    totalCount: number; // 合计数量
    totalPrice: number; // 合计金额，单位：元
    status: number; // 状态
    remark: string; // 备注
  }

  /** 其它入库单分页查询参数 */
  export interface StockInPageParams extends PageParam {
    no?: string;
    supplierId?: number;
    status?: number;
  }

  /** 其它入库单状态更新参数 */
  export interface StockInStatusParams {
    id: number;
    status: number;
  }
}

/**
 * 查询其它入库单分页
 */
export function getStockInPage(params: ErpStockInApi.StockInPageParams) {
  return requestClient.get<PageResult<ErpStockInApi.StockIn>>(
    '/erp/stock-in/page',
    {
      params,
    },
  );
}

/**
 * 查询其它入库单详情
 */
export function getStockIn(id: number) {
  return requestClient.get<ErpStockInApi.StockIn>(`/erp/stock-in/get?id=${id}`);
}

/**
 * 新增其它入库单
 */
export function createStockIn(data: ErpStockInApi.StockIn) {
  return requestClient.post('/erp/stock-in/create', data);
}

/**
 * 修改其它入库单
 */
export function updateStockIn(data: ErpStockInApi.StockIn) {
  return requestClient.put('/erp/stock-in/update', data);
}

/**
 * 更新其它入库单的状态
 */
export function updateStockInStatus(params: ErpStockInApi.StockInStatusParams) {
  return requestClient.put('/erp/stock-in/update-status', null, {
    params,
  });
}

/**
 * 删除其它入库单
 */
export function deleteStockIn(ids: number[]) {
  return requestClient.delete('/erp/stock-in/delete', {
    params: {
      ids: ids.join(','),
    },
  });
}

/**
 * 导出其它入库单 Excel
 */
export function exportStockIn(params: ErpStockInApi.StockInPageParams) {
  return requestClient.download('/erp/stock-in/export-excel', {
    params,
  });
}
