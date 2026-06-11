import { requestClient } from '#/api/request';

export namespace MesWmTransferDetailApi {
  /** MES 调拨明细 */
  export interface TransferDetail {
    id?: number; // 编号
    lineId?: number; // 转移单行编号
    transferId?: number; // 转移单编号
    itemId?: number; // 物料产品编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位名称
    quantity?: number; // 数量
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    toWarehouseId?: number; // 移入仓库编号
    toWarehouseName?: string; // 移入仓库名称
    toLocationId?: number; // 移入库区编号
    toLocationName?: string; // 移入库区名称
    toAreaId?: number; // 移入库位编号
    toAreaName?: string; // 移入库位名称
    remark?: string; // 备注
  }
}

/** 查询调拨明细列表（按行编号） */
export function getTransferDetailListByLineId(lineId: number) {
  return requestClient.get<MesWmTransferDetailApi.TransferDetail[]>(
    '/mes/wm/transfer-detail/list-by-line',
    { params: { lineId } },
  );
}

/** 查询调拨明细详情 */
export function getTransferDetail(id: number) {
  return requestClient.get<MesWmTransferDetailApi.TransferDetail>(
    `/mes/wm/transfer-detail/get?id=${id}`,
  );
}

/** 新增调拨明细 */
export function createTransferDetail(
  data: MesWmTransferDetailApi.TransferDetail,
) {
  return requestClient.post('/mes/wm/transfer-detail/create', data);
}

/** 修改调拨明细 */
export function updateTransferDetail(
  data: MesWmTransferDetailApi.TransferDetail,
) {
  return requestClient.put('/mes/wm/transfer-detail/update', data);
}

/** 删除调拨明细 */
export function deleteTransferDetail(id: number) {
  return requestClient.delete(`/mes/wm/transfer-detail/delete?id=${id}`);
}
