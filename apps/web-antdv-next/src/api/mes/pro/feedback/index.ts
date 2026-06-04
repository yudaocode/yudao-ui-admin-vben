import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProFeedbackApi {
  /** MES 生产报工 */
  export interface Feedback {
    id?: number;
    code?: string; // 报工单编号
    type?: number; // 报工类型
    channel?: string; // 报工途径
    feedbackTime?: number; // 报工时间
    workstationId?: number; // 工作站编号
    workstationCode?: string; // 工作站编码
    workstationName?: string; // 工作站名称
    routeId?: number; // 工艺路线编号
    routeCode?: string; // 工艺路线编码
    processId?: number; // 工序编号
    processCode?: string; // 工序编码
    processName?: string; // 工序名称
    checkFlag?: boolean; // 是否需要检验
    workOrderId?: number; // 生产工单编号
    workOrderCode?: string; // 工单编码
    workOrderName?: string; // 工单名称
    taskId?: number; // 生产任务编号
    taskCode?: string; // 任务编码
    itemId?: number; // 产品物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    itemSpecification?: string; // 规格型号
    unitMeasureId?: number; // 单位编号
    unitMeasureName?: string; // 单位名称
    expireDate?: number; // 过期日期
    scheduledQuantity?: number; // 排产数量
    feedbackQuantity?: number; // 本次报工数量
    qualifiedQuantity?: number; // 合格品数量
    unqualifiedQuantity?: number; // 不良品数量
    uncheckQuantity?: number; // 待检测数量
    laborScrapQuantity?: number; // 工废数量
    materialScrapQuantity?: number; // 料废数量
    otherScrapQuantity?: number; // 其他废品数量
    feedbackUserId?: number; // 报工用户编号
    feedbackUserNickname?: string; // 报工人昵称
    approveUserId?: number; // 审核用户编号
    approveUserNickname?: string; // 审核人昵称
    status?: number; // 状态
    remark?: string; // 备注
    creator?: string; // 创建人
    createTime?: number; // 创建时间
  }

  /** MES 生产报工分页查询参数 */
  export interface PageParams extends PageParam {
    code?: string;
    type?: number;
    workOrderId?: number;
    itemId?: number;
    feedbackUserId?: number;
    creator?: string;
    status?: number;
    feedbackTime?: string[];
  }
}

/** 查询生产报工分页 */
export function getFeedbackPage(params: MesProFeedbackApi.PageParams) {
  return requestClient.get<PageResult<MesProFeedbackApi.Feedback>>(
    '/mes/pro/feedback/page',
    { params },
  );
}

/** 查询生产报工详情 */
export function getFeedback(id: number) {
  return requestClient.get<MesProFeedbackApi.Feedback>(
    `/mes/pro/feedback/get?id=${id}`,
  );
}

/** 新增生产报工 */
export function createFeedback(data: MesProFeedbackApi.Feedback) {
  return requestClient.post<number>('/mes/pro/feedback/create', data);
}

/** 修改生产报工 */
export function updateFeedback(data: MesProFeedbackApi.Feedback) {
  return requestClient.put('/mes/pro/feedback/update', data);
}

/** 删除生产报工 */
export function deleteFeedback(id: number) {
  return requestClient.delete(`/mes/pro/feedback/delete?id=${id}`);
}

/** 导出生产报工 Excel */
export function exportFeedback(params: Partial<MesProFeedbackApi.PageParams>) {
  return requestClient.download('/mes/pro/feedback/export-excel', { params });
}

/** 提交生产报工 */
export function submitFeedback(id: number) {
  return requestClient.put(`/mes/pro/feedback/submit?id=${id}`);
}

/** 驳回生产报工 */
export function rejectFeedback(id: number) {
  return requestClient.put(`/mes/pro/feedback/reject?id=${id}`);
}

/** 审批生产报工（返回是否已审批完成） */
export function approveFeedback(id: number) {
  return requestClient.put<boolean>(`/mes/pro/feedback/approve?id=${id}`);
}
