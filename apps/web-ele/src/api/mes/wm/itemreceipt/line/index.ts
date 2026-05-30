import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmItemReceiptLineApi {
  /** MES 采购入库单行 */
  export interface ItemReceiptLine {
    id?: number; // 行编号
    receiptId?: number; // 入库单编号
    receiptCode?: string; // 入库单编码
    arrivalNoticeLineId?: number; // 到货通知单行编号
    purchaseOrderCode?: string; // 采购订单号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    receivedQuantity?: number; // 入库数量
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    productionDate?: number; // 生产日期
    expireDate?: number; // 有效期
    lotNumber?: string; // 生产批号
    iqcCheckFlag?: boolean; // 是否检验
    iqcId?: number; // 来料检验单编号
    iqcCode?: string; // 来料检验单编码
    remark?: string; // 备注
  }
}

/** 查询采购入库单行分页 */
export function getItemReceiptLinePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmItemReceiptLineApi.ItemReceiptLine>>(
    '/mes/wm/item-receipt-line/page',
    { params },
  );
}

/** 查询采购入库单行详情 */
export function getItemReceiptLine(id: number) {
  return requestClient.get<MesWmItemReceiptLineApi.ItemReceiptLine>(
    `/mes/wm/item-receipt-line/get?id=${id}`,
  );
}

/** 新增采购入库单行 */
export function createItemReceiptLine(
  data: MesWmItemReceiptLineApi.ItemReceiptLine,
) {
  return requestClient.post<number>('/mes/wm/item-receipt-line/create', data);
}

/** 修改采购入库单行 */
export function updateItemReceiptLine(
  data: MesWmItemReceiptLineApi.ItemReceiptLine,
) {
  return requestClient.put('/mes/wm/item-receipt-line/update', data);
}

/** 删除采购入库单行 */
export function deleteItemReceiptLine(id: number) {
  return requestClient.delete(`/mes/wm/item-receipt-line/delete?id=${id}`);
}
