import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesQcPendingInspectApi {
  /** MES 待检任务 */
  export interface PendingInspect {
    sourceDocType?: number; // 来源单据类型（MesBizTypeConstants）
    sourceDocId?: number; // 来源单据 ID
    sourceLineId?: number; // 来源单据行 ID
    sourceDocCode?: string; // 来源单据编号
    qcType?: number; // 检验类型（MesQcTypeEnum）
    itemId?: number; // 物料 ID
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitName?: string; // 单位名称
    quantity?: number; // 待检数量
    // 供应商（IQC 场景）
    vendorId?: number; // 供应商 ID
    vendorName?: string; // 供应商名称
    // 工单/工作站/任务（IPQC/RQC 场景）
    workOrderId?: number; // 生产工单 ID
    workstationId?: number; // 工作站 ID
    workstationName?: string; // 工作站名称
    taskId?: number; // 生产任务 ID
    taskCode?: string; // 生产任务编码
    // 客户（OQC/RQC 场景）
    clientId?: number; // 客户 ID
    clientName?: string; // 客户名称
    recordTime?: number; // 记录时间（epoch ms）
  }
}

/** 查询待检任务分页 */
export function getPendingInspectPage(params: PageParam) {
  return requestClient.get<PageResult<MesQcPendingInspectApi.PendingInspect>>(
    '/mes/qc/pending-inspect/page',
    { params },
  );
}
