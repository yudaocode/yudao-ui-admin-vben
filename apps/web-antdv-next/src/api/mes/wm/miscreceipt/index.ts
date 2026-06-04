import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmMiscReceiptApi {
  /** MES 杂项入库单 */
  export interface MiscReceipt {
    id?: number; // 编号
    code?: string; // 入库单编号
    name?: string; // 入库单名称
    type?: number; // 杂项类型
    sourceDocType?: string; // 来源单据类型
    sourceDocId?: number; // 来源单据编号
    sourceDocCode?: string; // 来源单据编码
    receiptDate?: number; // 入库日期
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询杂项入库单分页 */
export function getMiscReceiptPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmMiscReceiptApi.MiscReceipt>>(
    '/mes/wm/misc-receipt/page',
    { params },
  );
}

/** 查询杂项入库单详情 */
export function getMiscReceipt(id: number) {
  return requestClient.get<MesWmMiscReceiptApi.MiscReceipt>(
    `/mes/wm/misc-receipt/get?id=${id}`,
  );
}

/** 新增杂项入库单 */
export function createMiscReceipt(data: MesWmMiscReceiptApi.MiscReceipt) {
  return requestClient.post<number>('/mes/wm/misc-receipt/create', data);
}

/** 修改杂项入库单 */
export function updateMiscReceipt(data: MesWmMiscReceiptApi.MiscReceipt) {
  return requestClient.put('/mes/wm/misc-receipt/update', data);
}

/** 删除杂项入库单 */
export function deleteMiscReceipt(id: number) {
  return requestClient.delete(`/mes/wm/misc-receipt/delete?id=${id}`);
}

/** 提交杂项入库单 */
export function submitMiscReceipt(id: number) {
  return requestClient.put(`/mes/wm/misc-receipt/submit?id=${id}`);
}

/** 执行入库 */
export function finishMiscReceipt(id: number) {
  return requestClient.put(`/mes/wm/misc-receipt/finish?id=${id}`);
}

/** 取消杂项入库单 */
export function cancelMiscReceipt(id: number) {
  return requestClient.put(`/mes/wm/misc-receipt/cancel?id=${id}`);
}

/** 导出杂项入库单 */
export function exportMiscReceipt(params: any) {
  return requestClient.download('/mes/wm/misc-receipt/export-excel', { params });
}
