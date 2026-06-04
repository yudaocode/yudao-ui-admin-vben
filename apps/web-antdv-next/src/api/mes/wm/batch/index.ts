import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmBatchApi {
  /** MES 批次 */
  export interface Batch {
    id?: number; // 批次 ID
    code?: string; // 批次编码
    itemId?: number; // 物料 ID
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    itemSpecification?: string; // 规格型号
    unitName?: string; // 单位名称
    produceDate?: Date; // 生产日期
    expireDate?: Date; // 有效期
    receiptDate?: Date; // 入库日期
    vendorId?: number; // 供应商 ID
    vendorCode?: string; // 供应商编码
    vendorName?: string; // 供应商名称
    clientId?: number; // 客户 ID
    clientCode?: string; // 客户编码
    clientName?: string; // 客户名称
    purchaseOrderCode?: string; // 采购订单编号
    salesOrderCode?: string; // 销售订单编号
    workOrderId?: number; // 生产工单 ID
    workOrderCode?: string; // 生产工单编号
    taskId?: number; // 生产任务 ID
    taskCode?: string; // 生产任务编号
    workstationId?: number; // 工作站 ID
    workstationCode?: string; // 工作站编码
    toolId?: number; // 工具 ID
    toolCode?: string; // 工具编号
    moldId?: number; // 模具 ID
    lotNumber?: string; // 生产批号
    qualityStatus?: number; // 质量状态
    remark?: string; // 备注
  }

  /** MES 批次分页查询参数 */
  export interface PageParams extends PageParam {
    code?: string; // 批次号
    itemId?: number; // 物料编号
    vendorId?: number; // 供应商编号
    clientId?: number; // 客户编号
    workOrderId?: number; // 工单编号
    taskId?: number; // 生产任务编号
    workstationId?: number; // 工作站编号
    toolId?: number; // 工具编号
    moldId?: number; // 模具编号
    salesOrderCode?: string; // 销售订单号
    purchaseOrderCode?: string; // 采购订单号
    lotNumber?: string; // 批号
    qualityStatus?: number; // 质量状态
    produceDate?: string[]; // 生产日期
    expireDate?: string[]; // 过期日期
    receiptDate?: string[]; // 入库日期
  }
}

/** 查询批次详情 */
export function getBatch(id: number) {
  return requestClient.get<MesWmBatchApi.Batch>(`/mes/wm/batch/get?id=${id}`);
}

/** 查询批次分页 */
export function getBatchPage(params: MesWmBatchApi.PageParams) {
  return requestClient.get<PageResult<MesWmBatchApi.Batch>>(
    '/mes/wm/batch/page',
    { params },
  );
}

/** 批次向前追溯 */
export function getForwardBatchList(code: string) {
  return requestClient.get<MesWmBatchApi.Batch[]>('/mes/wm/batch/forward-list', {
    params: { code },
  });
}

/** 批次向后追溯 */
export function getBackwardBatchList(code: string) {
  return requestClient.get<MesWmBatchApi.Batch[]>(
    '/mes/wm/batch/backward-list',
    { params: { code } },
  );
}
