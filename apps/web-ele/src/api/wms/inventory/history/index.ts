import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace WmsInventoryHistoryApi {
  /** WMS 库存记录 */
  export interface InventoryHistory {
    id?: number;
    itemId?: number;
    itemCode?: string;
    itemName?: string;
    unit?: string;
    skuId?: number;
    skuCode?: string;
    skuName?: string;
    warehouseId?: number;
    warehouseName?: string;
    quantity?: number;
    beforeQuantity?: number;
    afterQuantity?: number;
    price?: number;
    totalPrice?: number;
    remark?: string;
    orderId?: number;
    orderNo?: string;
    orderType?: number;
    createTime?: Date;
  }
}

/** 查询库存记录分页 */
export function getInventoryHistoryPage(params: PageParam) {
  return requestClient.get<PageResult<WmsInventoryHistoryApi.InventoryHistory>>(
    '/wms/inventory-history/page',
    { params },
  );
}
