import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmOutsourceReceiptLineApi {
  /** MES 外协入库单行 */
  export interface OutsourceReceiptLine {
    id?: number; // 行编号
    receiptId?: number; // 入库单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 计量单位名称
    quantity?: number; // 入库数量
    batchId?: number; // 批次编号
    batchCode?: string; // 批次编码
    productionDate?: number; // 生产日期
    expireDate?: number; // 有效期
    lotNumber?: string; // 生产批号
    iqcCheckFlag?: boolean; // 是否需要质检
    qualityStatus?: number; // 质量状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询外协入库单行分页 */
export function getOutsourceReceiptLinePage(params: PageParam) {
  return requestClient.get<
    PageResult<MesWmOutsourceReceiptLineApi.OutsourceReceiptLine>
  >('/mes/wm/outsource-receipt-line/page', { params });
}

/** 查询外协入库单行详情 */
export function getOutsourceReceiptLine(id: number) {
  return requestClient.get<MesWmOutsourceReceiptLineApi.OutsourceReceiptLine>(
    `/mes/wm/outsource-receipt-line/get?id=${id}`,
  );
}

/** 新增外协入库单行 */
export function createOutsourceReceiptLine(
  data: MesWmOutsourceReceiptLineApi.OutsourceReceiptLine,
) {
  return requestClient.post('/mes/wm/outsource-receipt-line/create', data);
}

/** 修改外协入库单行 */
export function updateOutsourceReceiptLine(
  data: MesWmOutsourceReceiptLineApi.OutsourceReceiptLine,
) {
  return requestClient.put('/mes/wm/outsource-receipt-line/update', data);
}

/** 删除外协入库单行 */
export function deleteOutsourceReceiptLine(id: number) {
  return requestClient.delete(`/mes/wm/outsource-receipt-line/delete?id=${id}`);
}
