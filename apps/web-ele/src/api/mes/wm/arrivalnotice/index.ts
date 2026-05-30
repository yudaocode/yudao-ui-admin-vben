import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmArrivalNoticeApi {
  /** MES 到货通知单 */
  export interface ArrivalNotice {
    id?: number; // 通知单编号
    code?: string; // 通知单编号
    name?: string; // 通知单名称
    purchaseOrderCode?: string; // 采购订单编号
    vendorId?: number; // 供应商编号
    vendorCode?: string; // 供应商编码
    vendorName?: string; // 供应商名称
    arrivalDate?: number; // 到货日期
    contactName?: string; // 联系人
    contactTelephone?: string; // 联系方式
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询到货通知单分页 */
export function getArrivalNoticePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmArrivalNoticeApi.ArrivalNotice>>(
    '/mes/wm/arrival-notice/page',
    { params },
  );
}

/** 查询到货通知单详情 */
export function getArrivalNotice(id: number) {
  return requestClient.get<MesWmArrivalNoticeApi.ArrivalNotice>(
    `/mes/wm/arrival-notice/get?id=${id}`,
  );
}

/** 新增到货通知单 */
export function createArrivalNotice(
  data: MesWmArrivalNoticeApi.ArrivalNotice,
) {
  return requestClient.post<number>('/mes/wm/arrival-notice/create', data);
}

/** 修改到货通知单 */
export function updateArrivalNotice(
  data: MesWmArrivalNoticeApi.ArrivalNotice,
) {
  return requestClient.put('/mes/wm/arrival-notice/update', data);
}

/** 删除到货通知单 */
export function deleteArrivalNotice(id: number) {
  return requestClient.delete(`/mes/wm/arrival-notice/delete?id=${id}`);
}

/** 提交到货通知单 */
export function submitArrivalNotice(id: number) {
  return requestClient.put(`/mes/wm/arrival-notice/submit?id=${id}`);
}

/** 导出到货通知单 */
export function exportArrivalNotice(params: any) {
  return requestClient.download('/mes/wm/arrival-notice/export-excel', {
    params,
  });
}
