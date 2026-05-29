import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmOutsourceIssueApi {
  /** MES 外协发料单 */
  export interface OutsourceIssue {
    id?: number; // 发料单编号
    code?: string; // 发料单编号
    name?: string; // 发料单名称
    vendorId?: number; // 供应商编号
    vendorCode?: string; // 供应商编码
    vendorName?: string; // 供应商名称
    workOrderId?: number; // 生产工单编号
    workOrderCode?: string; // 生产工单编码
    workOrderName?: string; // 生产工单名称
    issueDate?: number; // 发料日期
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询外协发料单分页 */
export function getOutsourceIssuePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmOutsourceIssueApi.OutsourceIssue>>(
    '/mes/wm/outsource-issue/page',
    { params },
  );
}

/** 查询外协发料单详情 */
export function getOutsourceIssue(id: number) {
  return requestClient.get<MesWmOutsourceIssueApi.OutsourceIssue>(
    `/mes/wm/outsource-issue/get?id=${id}`,
  );
}

/** 新增外协发料单 */
export function createOutsourceIssue(
  data: MesWmOutsourceIssueApi.OutsourceIssue,
) {
  return requestClient.post<number>('/mes/wm/outsource-issue/create', data);
}

/** 修改外协发料单 */
export function updateOutsourceIssue(
  data: MesWmOutsourceIssueApi.OutsourceIssue,
) {
  return requestClient.put('/mes/wm/outsource-issue/update', data);
}

/** 删除外协发料单 */
export function deleteOutsourceIssue(id: number) {
  return requestClient.delete(`/mes/wm/outsource-issue/delete?id=${id}`);
}

/** 提交外协发料单 */
export function submitOutsourceIssue(id: number) {
  return requestClient.put(`/mes/wm/outsource-issue/submit?id=${id}`);
}

/** 执行拣货 */
export function stockOutsourceIssue(id: number) {
  return requestClient.put(`/mes/wm/outsource-issue/stock?id=${id}`);
}

/** 执行领出 */
export function finishOutsourceIssue(id: number) {
  return requestClient.put(`/mes/wm/outsource-issue/finish?id=${id}`);
}

/** 取消外协发料单 */
export function cancelOutsourceIssue(id: number) {
  return requestClient.put(`/mes/wm/outsource-issue/cancel?id=${id}`);
}

/** 校验外协发料单拣货数量是否与发料数量一致 */
export function checkOutsourceIssueQuantity(id: number) {
  return requestClient.get<boolean>(
    `/mes/wm/outsource-issue/check-quantity?id=${id}`,
  );
}

/** 导出外协发料单 */
export function exportOutsourceIssue(params: any) {
  return requestClient.download('/mes/wm/outsource-issue/export-excel', {
    params,
  });
}
