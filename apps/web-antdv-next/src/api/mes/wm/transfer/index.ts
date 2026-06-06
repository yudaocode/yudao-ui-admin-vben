import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmTransferApi {
  /** MES 转移单 */
  export interface Transfer {
    id?: number; // 编号
    code?: string; // 转移单编号
    name?: string; // 转移单名称
    type?: number; // 转移单类型
    deliveryFlag?: boolean; // 是否配送
    recipientName?: string; // 收货人
    recipientTelephone?: string; // 联系电话
    destinationAddress?: string; // 目的地
    carrier?: string; // 承运商
    shippingNumber?: string; // 运输单号
    confirmFlag?: boolean; // 是否确认
    transferDate?: string; // 转移日期
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: number; // 创建时间
  }

  /** MES 转移单分页查询参数 */
  export interface PageParams extends PageParam {
    code?: string;
    name?: string;
    type?: number;
    status?: number;
  }
}

/** 查询转移单分页 */
export function getTransferPage(params: MesWmTransferApi.PageParams) {
  return requestClient.get<PageResult<MesWmTransferApi.Transfer>>(
    '/mes/wm/transfer/page',
    { params },
  );
}

/** 查询转移单详情 */
export function getTransfer(id: number) {
  return requestClient.get<MesWmTransferApi.Transfer>(
    `/mes/wm/transfer/get?id=${id}`,
  );
}

/** 新增转移单 */
export function createTransfer(data: MesWmTransferApi.Transfer) {
  return requestClient.post<number>('/mes/wm/transfer/create', data);
}

/** 修改转移单 */
export function updateTransfer(data: MesWmTransferApi.Transfer) {
  return requestClient.put('/mes/wm/transfer/update', data);
}

/** 删除转移单 */
export function deleteTransfer(id: number) {
  return requestClient.delete(`/mes/wm/transfer/delete?id=${id}`);
}

/** 提交转移单 */
export function submitTransfer(id: number) {
  return requestClient.put(`/mes/wm/transfer/submit?id=${id}`);
}

/** 到货确认 */
export function confirmTransfer(id: number) {
  return requestClient.put(`/mes/wm/transfer/confirm?id=${id}`);
}

/** 执行上架 */
export function stockTransfer(id: number) {
  return requestClient.put(`/mes/wm/transfer/stock?id=${id}`);
}

/** 完成转移 */
export function finishTransfer(id: number) {
  return requestClient.put(`/mes/wm/transfer/finish?id=${id}`);
}

/** 取消转移单 */
export function cancelTransfer(id: number) {
  return requestClient.put(`/mes/wm/transfer/cancel?id=${id}`);
}

/** 导出转移单 */
export function exportTransfer(params: any) {
  return requestClient.download('/mes/wm/transfer/export-excel', { params });
}
