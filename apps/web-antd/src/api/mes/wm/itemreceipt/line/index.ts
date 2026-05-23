import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmItemReceiptLineApi {
  /** MES 物料接收单行 */
  export interface ItemReceiptLine {
    id?: number; // 行编号
    receiptId?: number; // 入库单编号
    receiptCode?: string; // 入库单编码
    purchaseOrderCode?: string; // 采购订单号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    receivedQuantity?: number; // 入库数量
    batchCode?: string; // 批次号
  }
}

/** 查询物料接收单行分页 */
export function getItemReceiptLinePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmItemReceiptLineApi.ItemReceiptLine>>(
    '/mes/wm/item-receipt-line/page',
    { params },
  );
}
