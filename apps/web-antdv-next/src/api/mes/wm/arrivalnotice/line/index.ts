import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmArrivalNoticeLineApi {
  /** MES 到货通知单行 */
  export interface ArrivalNoticeLine {
    id?: number; // 行编号
    noticeId?: number; // 到货通知单编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位
    arrivalQuantity?: number; // 到货数量
    qualifiedQuantity?: number; // 合格数量
    iqcCheckFlag?: boolean; // 是否检验
    iqcId?: number; // 来料检验单编号
    iqcCode?: string; // 来料检验单编码
    remark?: string; // 备注
  }
}

/** 查询到货通知单行分页 */
export function getArrivalNoticeLinePage(params: PageParam) {
  return requestClient.get<
    PageResult<MesWmArrivalNoticeLineApi.ArrivalNoticeLine>
  >('/mes/wm/arrival-notice-line/page', { params });
}

/** 查询到货通知单行详情 */
export function getArrivalNoticeLine(id: number) {
  return requestClient.get<MesWmArrivalNoticeLineApi.ArrivalNoticeLine>(
    `/mes/wm/arrival-notice-line/get?id=${id}`,
  );
}

/** 新增到货通知单行 */
export function createArrivalNoticeLine(
  data: MesWmArrivalNoticeLineApi.ArrivalNoticeLine,
) {
  return requestClient.post<number>(
    '/mes/wm/arrival-notice-line/create',
    data,
  );
}

/** 修改到货通知单行 */
export function updateArrivalNoticeLine(
  data: MesWmArrivalNoticeLineApi.ArrivalNoticeLine,
) {
  return requestClient.put('/mes/wm/arrival-notice-line/update', data);
}

/** 删除到货通知单行 */
export function deleteArrivalNoticeLine(id: number) {
  return requestClient.delete(`/mes/wm/arrival-notice-line/delete?id=${id}`);
}
