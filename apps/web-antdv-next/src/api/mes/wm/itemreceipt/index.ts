import type { PageParam, PageResult } from '@vben/request';

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
    receiptDate?: number; // 入库日期
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询采购入库单分页 */
export function getItemReceiptPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmItemReceiptApi.ItemReceipt>>(
    '/mes/wm/item-receipt/page',
    { params },
  );
}

/** 查询采购入库单详情 */
export function getItemReceipt(id: number) {
  return requestClient.get<MesWmItemReceiptApi.ItemReceipt>(
    `/mes/wm/item-receipt/get?id=${id}`,
  );
}

/** 新增采购入库单 */
export function createItemReceipt(data: MesWmItemReceiptApi.ItemReceipt) {
  return requestClient.post<number>('/mes/wm/item-receipt/create', data);
}

/** 修改采购入库单 */
export function updateItemReceipt(data: MesWmItemReceiptApi.ItemReceipt) {
  return requestClient.put('/mes/wm/item-receipt/update', data);
}

/** 删除采购入库单 */
export function deleteItemReceipt(id: number) {
  return requestClient.delete(`/mes/wm/item-receipt/delete?id=${id}`);
}

/** 提交采购入库单 */
export function submitItemReceipt(id: number) {
  return requestClient.put(`/mes/wm/item-receipt/submit?id=${id}`);
}

/** 执行上架 */
export function stockItemReceipt(id: number) {
  return requestClient.put(`/mes/wm/item-receipt/stock?id=${id}`);
}

/** 执行入库 */
export function finishItemReceipt(id: number) {
  return requestClient.put(`/mes/wm/item-receipt/finish?id=${id}`);
}

/** 取消采购入库单 */
export function cancelItemReceipt(id: number) {
  return requestClient.put(`/mes/wm/item-receipt/cancel?id=${id}`);
}

/** 导出采购入库单 */
export function exportItemReceipt(params: any) {
  return requestClient.download('/mes/wm/item-receipt/export-excel', {
    params,
  });
}
