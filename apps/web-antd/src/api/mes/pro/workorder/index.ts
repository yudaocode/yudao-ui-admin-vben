import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProWorkOrderApi {
  /** MES 生产工单 */
  export interface WorkOrder {
    id?: number; // 编号
    code?: string; // 工单编码
    name?: string; // 工单名称
    type?: number; // 工单类型
    orderSourceType?: number; // 来源类型
    orderSourceCode?: string; // 来源单据编号
    productId?: number; // 产品编号
    productName?: string; // 产品名称
    productCode?: string; // 产品编码
    productSpecification?: string; // 规格型号
    unitMeasureName?: string; // 单位名称
    quantity?: number; // 生产数量
    quantityProduced?: number; // 已生产数量
    quantityChanged?: number; // 调整数量
    quantityScheduled?: number; // 已排产数量
    clientId?: number; // 客户编号
    clientCode?: string; // 客户编码
    clientName?: string; // 客户名称
    vendorId?: number; // 供应商编号
    vendorName?: string; // 供应商名称
    vendorCode?: string; // 供应商编码
    batchCode?: string; // 批次号
    requestDate?: number; // 需求日期
    parentId?: number; // 父工单编号
    parentCode?: string; // 父工单编码
    finishDate?: number; // 完成时间
    cancelDate?: number; // 取消时间
    status?: number; // 工单状态
    remark?: string; // 备注
    createTime?: number; // 创建时间
  }

  /** MES 生产工单分页查询参数 */
  export interface PageParams extends PageParam {
    code?: string;
    name?: string;
    orderSourceCode?: string;
    productId?: number;
    clientId?: number;
    status?: number;
    type?: number;
    requestDate?: number[];
  }
}

/** 查询生产工单分页 */
export function getWorkOrderPage(params: MesProWorkOrderApi.PageParams) {
  return requestClient.get<PageResult<MesProWorkOrderApi.WorkOrder>>(
    '/mes/pro/work-order/page',
    { params },
  );
}

/** 查询生产工单详情 */
export function getWorkOrder(id: number) {
  return requestClient.get<MesProWorkOrderApi.WorkOrder>(
    `/mes/pro/work-order/get?id=${id}`,
  );
}

/** 新增生产工单 */
export function createWorkOrder(data: MesProWorkOrderApi.WorkOrder) {
  return requestClient.post<number>('/mes/pro/work-order/create', data);
}

/** 修改生产工单 */
export function updateWorkOrder(data: MesProWorkOrderApi.WorkOrder) {
  return requestClient.put('/mes/pro/work-order/update', data);
}

/** 删除生产工单 */
export function deleteWorkOrder(id: number) {
  return requestClient.delete(`/mes/pro/work-order/delete?id=${id}`);
}

/** 导出生产工单 */
export function exportWorkOrder(params: any) {
  return requestClient.download('/mes/pro/work-order/export-excel', { params });
}

/** 完成工单 */
export function finishWorkOrder(id: number) {
  return requestClient.put(`/mes/pro/work-order/finish?id=${id}`);
}

/** 取消工单 */
export function cancelWorkOrder(id: number) {
  return requestClient.put(`/mes/pro/work-order/cancel?id=${id}`);
}

/** 确认工单 */
export function confirmWorkOrder(id: number) {
  return requestClient.put(`/mes/pro/work-order/confirm?id=${id}`);
}
