import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace WmsInventoryApi {
  /** WMS 库存统计 */
  export interface Inventory {
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
    remark?: string;
    createTime?: Date;
  }

  /** WMS 库存统计列表请求 */
  export interface InventoryListReq {
    warehouseId: number;
  }
}

/** 查询库存统计分页 */
export function getInventoryPage(params: PageParam) {
  return requestClient.get<PageResult<WmsInventoryApi.Inventory>>(
    '/wms/inventory/page',
    { params },
  );
}

/** 查询库存统计列表 */
export function getInventoryList(params: WmsInventoryApi.InventoryListReq) {
  return requestClient.get<WmsInventoryApi.Inventory[]>('/wms/inventory/list', {
    params,
  });
}
