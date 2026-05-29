import { requestClient } from '#/api/request';

export namespace MesWmItemReceiptDetailApi {
  /** MES 采购入库明细 */
  export interface ItemReceiptDetail {
    id?: number; // 明细编号
    lineId?: number; // 入库单行编号
    receiptId?: number; // 入库单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    quantity?: number; // 数量
    batchId?: number; // 批次编号
    warehouseId?: number; // 仓库编号
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationName?: string; // 库区名称
    areaId?: number; // 库位编号
    areaName?: string; // 库位名称
    remark?: string; // 备注
  }
}

/** 查询采购入库明细列表（按行编号） */
export function getItemReceiptDetailListByLineId(lineId: number) {
  return requestClient.get<MesWmItemReceiptDetailApi.ItemReceiptDetail[]>(
    '/mes/wm/item-receipt-detail/list-by-line',
    { params: { lineId } },
  );
}

/** 查询采购入库明细详情 */
export function getItemReceiptDetail(id: number) {
  return requestClient.get<MesWmItemReceiptDetailApi.ItemReceiptDetail>(
    `/mes/wm/item-receipt-detail/get?id=${id}`,
  );
}

/** 新增采购入库明细 */
export function createItemReceiptDetail(
  data: MesWmItemReceiptDetailApi.ItemReceiptDetail,
) {
  return requestClient.post<number>('/mes/wm/item-receipt-detail/create', data);
}

/** 修改采购入库明细 */
export function updateItemReceiptDetail(
  data: MesWmItemReceiptDetailApi.ItemReceiptDetail,
) {
  return requestClient.put('/mes/wm/item-receipt-detail/update', data);
}

/** 删除采购入库明细 */
export function deleteItemReceiptDetail(id: number) {
  return requestClient.delete(`/mes/wm/item-receipt-detail/delete?id=${id}`);
}
