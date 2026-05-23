import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmProductSalesApi {
  /** MES 销售出库单 */
  export interface ProductSales {
    id?: number; // 销售出库单编号
    code?: string; // 出库单编号
    name?: string; // 出库单名称
    salesOrderCode?: string; // 销售订单编号
    salesDate?: Date; // 出库日期
    status?: number; // 单据状态
  }
}

/** 查询销售出库单分页 */
export function getProductSalesPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmProductSalesApi.ProductSales>>(
    '/mes/wm/product-sales/page',
    { params },
  );
}
