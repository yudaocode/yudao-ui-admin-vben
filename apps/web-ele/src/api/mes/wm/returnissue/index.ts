import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmReturnIssueApi {
  /** MES 生产退料单 */
  export interface ReturnIssue {
    id?: number; // 退料单编号
    code?: string; // 退料单编号
    name?: string; // 退料单名称
    workstationId?: number; // 工作站编号
    workstationName?: string; // 工作站名称
    workOrderId?: number; // 生产工单编号
    workOrderCode?: string; // 生产工单编码
    type?: number; // 退料类型
    returnDate?: number; // 退料日期
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询生产退料单分页 */
export function getReturnIssuePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmReturnIssueApi.ReturnIssue>>(
    '/mes/wm/return-issue/page',
    { params },
  );
}

/** 查询生产退料单详情 */
export function getReturnIssue(id: number) {
  return requestClient.get<MesWmReturnIssueApi.ReturnIssue>(
    `/mes/wm/return-issue/get?id=${id}`,
  );
}

/** 新增生产退料单 */
export function createReturnIssue(data: MesWmReturnIssueApi.ReturnIssue) {
  return requestClient.post<number>('/mes/wm/return-issue/create', data);
}

/** 修改生产退料单 */
export function updateReturnIssue(data: MesWmReturnIssueApi.ReturnIssue) {
  return requestClient.put('/mes/wm/return-issue/update', data);
}

/** 删除生产退料单 */
export function deleteReturnIssue(id: number) {
  return requestClient.delete(`/mes/wm/return-issue/delete?id=${id}`);
}

/** 提交生产退料单 */
export function submitReturnIssue(id: number) {
  return requestClient.put(`/mes/wm/return-issue/submit?id=${id}`);
}

/** 入库上架 */
export function stockReturnIssue(id: number) {
  return requestClient.put(`/mes/wm/return-issue/stock?id=${id}`);
}

/** 完成生产退料单 */
export function finishReturnIssue(id: number) {
  return requestClient.put(`/mes/wm/return-issue/finish?id=${id}`);
}

/** 取消生产退料单 */
export function cancelReturnIssue(id: number) {
  return requestClient.put(`/mes/wm/return-issue/cancel?id=${id}`);
}

/** 导出生产退料单 */
export function exportReturnIssue(params: any) {
  return requestClient.download('/mes/wm/return-issue/export-excel', {
    params,
  });
}
