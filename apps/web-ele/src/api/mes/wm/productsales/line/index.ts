import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmProductSalesLineApi {
  /** MES 销售出库单行 */
  export interface ProductSalesLine {
    id?: number; // 行编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    quantity?: number; // 出库数量
    batchCode?: string; // 批次号
  }
}

/** 查询销售出库单行分页 */
export function getProductSalesLinePage(params: PageParam) {
  return requestClient.get<
    PageResult<MesWmProductSalesLineApi.ProductSalesLine>
  >('/mes/wm/product-sales-line/page', { params });
}
