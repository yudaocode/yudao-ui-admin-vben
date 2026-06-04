import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmSalesNoticeLineApi {
  /** MES 发货通知单行 */
  export interface SalesNoticeLine {
    id?: number; // 行编号
    noticeId?: number; // 发货通知单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    quantity?: number; // 发货数量
    oqcCheckFlag?: boolean; // 是否检验
    remark?: string; // 备注
  }
}

/** 查询发货通知单行分页 */
export function getSalesNoticeLinePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmSalesNoticeLineApi.SalesNoticeLine>>(
    '/mes/wm/sales-notice-line/page',
    { params },
  );
}

/** 查询发货通知单行详情 */
export function getSalesNoticeLine(id: number) {
  return requestClient.get<MesWmSalesNoticeLineApi.SalesNoticeLine>(
    `/mes/wm/sales-notice-line/get?id=${id}`,
  );
}

/** 新增发货通知单行 */
export function createSalesNoticeLine(
  data: MesWmSalesNoticeLineApi.SalesNoticeLine,
) {
  return requestClient.post<number>('/mes/wm/sales-notice-line/create', data);
}

/** 修改发货通知单行 */
export function updateSalesNoticeLine(
  data: MesWmSalesNoticeLineApi.SalesNoticeLine,
) {
  return requestClient.put('/mes/wm/sales-notice-line/update', data);
}

/** 删除发货通知单行 */
export function deleteSalesNoticeLine(id: number) {
  return requestClient.delete(`/mes/wm/sales-notice-line/delete?id=${id}`);
}
