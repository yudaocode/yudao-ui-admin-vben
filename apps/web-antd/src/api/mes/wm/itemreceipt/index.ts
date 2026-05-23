import { requestClient } from '#/api/request';

export namespace MesWmItemReceiptApi {
  /** MES 采购入库单 */
  export interface ItemReceipt {
    id?: number; // 入库单编号
    code?: string; // 入库单编码
    name?: string; // 入库单名称
    iqcId?: number; // 来料检验单编号
    iqcCode?: string; // 来料检验单编码
    noticeId?: number; // 到货通知单编号
    noticeCode?: string; // 到货通知单编码
    purchaseOrderCode?: string; // 采购订单号
    vendorId?: number; // 供应商编号
    vendorName?: string; // 供应商名称
    warehouseId?: number; // 仓库编号
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationName?: string; // 库区名称
    areaId?: number; // 库位编号
    areaName?: string; // 库位名称
    receiptDate?: Date | number | string; // 入库日期
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询采购入库单详情 */
export function getItemReceipt(id: number) {
  return requestClient.get<MesWmItemReceiptApi.ItemReceipt>(
    `/mes/wm/item-receipt/get?id=${id}`,
  );
}
