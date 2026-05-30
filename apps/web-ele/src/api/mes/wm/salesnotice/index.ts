import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmSalesNoticeApi {
  /** MES 发货通知单 */
  export interface SalesNotice {
    id?: number; // 通知单编号
    code?: string; // 通知单编号
    name?: string; // 通知单名称
    salesOrderCode?: string; // 销售订单编号
    clientId?: number; // 客户编号
    clientCode?: string; // 客户编码
    clientName?: string; // 客户名称
    salesDate?: number; // 发货日期
    recipientName?: string; // 收货人
    recipientTelephone?: string; // 联系方式
    recipientAddress?: string; // 收货地址
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询发货通知单分页 */
export function getSalesNoticePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmSalesNoticeApi.SalesNotice>>(
    '/mes/wm/sales-notice/page',
    { params },
  );
}

/** 查询发货通知单详情 */
export function getSalesNotice(id: number) {
  return requestClient.get<MesWmSalesNoticeApi.SalesNotice>(
    `/mes/wm/sales-notice/get?id=${id}`,
  );
}

/** 新增发货通知单 */
export function createSalesNotice(data: MesWmSalesNoticeApi.SalesNotice) {
  return requestClient.post<number>('/mes/wm/sales-notice/create', data);
}

/** 修改发货通知单 */
export function updateSalesNotice(data: MesWmSalesNoticeApi.SalesNotice) {
  return requestClient.put('/mes/wm/sales-notice/update', data);
}

/** 删除发货通知单 */
export function deleteSalesNotice(id: number) {
  return requestClient.delete(`/mes/wm/sales-notice/delete?id=${id}`);
}

/** 提交发货通知单 */
export function submitSalesNotice(id: number) {
  return requestClient.put(`/mes/wm/sales-notice/submit?id=${id}`);
}

/** 导出发货通知单 */
export function exportSalesNotice(params: any) {
  return requestClient.download('/mes/wm/sales-notice/export-excel', {
    params,
  });
}
