import { requestClient } from '#/api/request';

export namespace MesWmTransferLineApi {
  /** MES 转移单行 */
  export interface TransferLine {
    id?: number; // 编号
    transferId?: number; // 转移单编号
    materialStockId?: number; // 库存台账编号
    itemId?: number; // 物料产品编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位名称
    quantity?: number; // 转移数量
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    fromWarehouseId?: number; // 移出仓库编号
    fromWarehouseName?: string; // 移出仓库名称
    fromLocationId?: number; // 移出库区编号
    fromLocationName?: string; // 移出库区名称
    fromAreaId?: number; // 移出库位编号
    fromAreaName?: string; // 移出库位名称
    remark?: string; // 备注
  }
}

/** 查询转移单行列表 */
export function getTransferLineList(transferId: number) {
  return requestClient.get<MesWmTransferLineApi.TransferLine[]>(
    '/mes/wm/transfer-line/list',
    { params: { transferId } },
  );
}

/** 查询转移单行详情 */
export function getTransferLine(id: number) {
  return requestClient.get<MesWmTransferLineApi.TransferLine>(
    `/mes/wm/transfer-line/get?id=${id}`,
  );
}

/** 新增转移单行 */
export function createTransferLine(data: MesWmTransferLineApi.TransferLine) {
  return requestClient.post('/mes/wm/transfer-line/create', data);
}

/** 修改转移单行 */
export function updateTransferLine(data: MesWmTransferLineApi.TransferLine) {
  return requestClient.put('/mes/wm/transfer-line/update', data);
}

/** 删除转移单行 */
export function deleteTransferLine(id: number) {
  return requestClient.delete(`/mes/wm/transfer-line/delete?id=${id}`);
}
