import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ErpStockApi {
  /** 产品库存信息 */
  export interface Stock {
    id?: number; // 编号
    productId: number; // 产品编号
    warehouseId: number; // 仓库编号
    count: number; // 库存数量
  }

  /** 产品库存查询参数 */
  export interface StockQueryReqVO {
    productId: number;
    warehouseId: number;
  }
}

/** 查询产品库存分页 */
export function getStockPage(params: PageParam) {
  return requestClient.get<PageResult<ErpStockApi.Stock>>('/erp/stock/page', {
    params,
  });
}

/** 按产品 + 仓库获得产品库存 */
export function getStockByProductAndWarehouse(
  productId: number,
  warehouseId: number,
) {
  return requestClient.get<ErpStockApi.Stock | null>('/erp/stock/get', {
    params: { productId, warehouseId },
  });
}

/** 获得产品库存数量 */
export async function getStockCount(productId: number, warehouseId?: number) {
  if (warehouseId !== undefined && warehouseId !== null) {
    const stock = await getStockByProductAndWarehouse(productId, warehouseId);
    return stock?.count ?? 0;
  }
  return requestClient.get<number>('/erp/stock/get-count', {
    params: { productId },
  });
}

/** 导出产品库存 Excel */
export function exportStock(params: any) {
  return requestClient.download('/erp/stock/export-excel', {
    params,
  });
}

/** 获取指定仓库的库存数量 */
export function getWarehouseStockCount(params: ErpStockApi.StockQueryReqVO) {
  return getStockCount(params.productId, params.warehouseId);
}
