import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmProductIssueApi {
  /** MES 领料出库单 */
  export interface ProductIssue {
    id?: number; // 领料单编号
    code?: string; // 领料单编号
    name?: string; // 领料单名称
    workstationId?: number; // 工作站编号
    workstationCode?: string; // 工作站编码
    workstationName?: string; // 工作站名称
    workOrderId?: number; // 生产工单编号
    workOrderCode?: string; // 生产工单编码
    clientCode?: string; // 客户编码
    clientName?: string; // 客户名称
    requiredTime?: number; // 需求时间
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询领料出库单分页 */
export function getProductIssuePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmProductIssueApi.ProductIssue>>(
    '/mes/wm/product-issue/page',
    { params },
  );
}

/** 查询领料出库单详情 */
export function getProductIssue(id: number) {
  return requestClient.get<MesWmProductIssueApi.ProductIssue>(
    `/mes/wm/product-issue/get?id=${id}`,
  );
}

/** 新增领料出库单 */
export function createProductIssue(data: MesWmProductIssueApi.ProductIssue) {
  return requestClient.post<number>('/mes/wm/product-issue/create', data);
}

/** 修改领料出库单 */
export function updateProductIssue(data: MesWmProductIssueApi.ProductIssue) {
  return requestClient.put('/mes/wm/product-issue/update', data);
}

/** 删除领料出库单 */
export function deleteProductIssue(id: number) {
  return requestClient.delete(`/mes/wm/product-issue/delete?id=${id}`);
}

/** 提交领料出库单 */
export function submitProductIssue(id: number) {
  return requestClient.put(`/mes/wm/product-issue/submit?id=${id}`);
}

/** 执行拣货 */
export function stockProductIssue(id: number) {
  return requestClient.put(`/mes/wm/product-issue/stock?id=${id}`);
}

/** 完成领料出库单 */
export function finishProductIssue(id: number) {
  return requestClient.put(`/mes/wm/product-issue/finish?id=${id}`);
}

/** 取消领料出库单 */
export function cancelProductIssue(id: number) {
  return requestClient.put(`/mes/wm/product-issue/cancel?id=${id}`);
}

/** 校验领料出库单拣货数量是否与领料数量一致 */
export function checkProductIssueQuantity(id: number) {
  return requestClient.get<boolean>(
    `/mes/wm/product-issue/check-quantity?id=${id}`,
  );
}

/** 导出领料出库单 */
export function exportProductIssue(params: any) {
  return requestClient.download('/mes/wm/product-issue/export-excel', {
    params,
  });
}
