import { requestClient } from '#/api/request';

export namespace MesWmMiscReceiptLineApi {
  /** MES 杂项入库单行 */
  export interface MiscReceiptLine {
    id?: number; // 编号
    receiptId?: number; // 入库单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 计量单位名称
    quantity?: number; // 入库数量
    batchCode?: string; // 批次号
    warehouseId?: number; // 仓库编号
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationName?: string; // 库区名称
    areaId?: number; // 库位编号
    areaName?: string; // 库位名称
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询杂项入库单行列表 */
export function getMiscReceiptLineListByReceiptId(receiptId: number) {
  return requestClient.get<MesWmMiscReceiptLineApi.MiscReceiptLine[]>(
    `/mes/wm/misc-receipt-line/list-by-receipt-id?receiptId=${receiptId}`,
  );
}

/** 查询杂项入库单行详情 */
export function getMiscReceiptLine(id: number) {
  return requestClient.get<MesWmMiscReceiptLineApi.MiscReceiptLine>(
    `/mes/wm/misc-receipt-line/get?id=${id}`,
  );
}

/** 新增杂项入库单行 */
export function createMiscReceiptLine(
  data: MesWmMiscReceiptLineApi.MiscReceiptLine,
) {
  return requestClient.post('/mes/wm/misc-receipt-line/create', data);
}

/** 修改杂项入库单行 */
export function updateMiscReceiptLine(
  data: MesWmMiscReceiptLineApi.MiscReceiptLine,
) {
  return requestClient.put('/mes/wm/misc-receipt-line/update', data);
}

/** 删除杂项入库单行 */
export function deleteMiscReceiptLine(id: number) {
  return requestClient.delete(`/mes/wm/misc-receipt-line/delete?id=${id}`);
}
