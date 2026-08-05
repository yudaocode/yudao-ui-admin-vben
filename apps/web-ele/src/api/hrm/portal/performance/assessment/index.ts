import type { PageParam, PageResult } from '@vben/request';

import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { requestClient } from '#/api/request';

export namespace HrmPortalPerformanceAssessmentApi {
  /** 考核摘要 */
  export interface AssessmentSummary {
    id: number; // 编号
    planId: number; // 绩效计划编号
    name?: string; // 绩效计划名称
    status?: number; // 考核状态
    stageType?: number; // 阶段状态
    score?: number; // 得分
    resultLevel?: string; // 结果等级
    coefficient?: number; // 绩效系数
    resultAuditStatus?: number; // 结果审核状态
    resultAuditTime?: Date; // 结果审核时间
    resultAuditReason?: string; // 结果审核意见
    appealReason?: string; // 申诉原因
    appealStatus?: number; // 申诉状态
    appealTime?: Date; // 申诉处理时间
    appealComment?: string; // 申诉处理意见
    startTime?: string; // 开始日期
    endTime?: string; // 结束日期
    archiveTime?: Date; // 归档时间
  }

  /** 任务数量 */
  export interface TaskCount {
    fillPendingCount: number; // 待填写指标数量
    fillCompletedCount: number; // 已填写指标数量
    targetPendingCount: number; // 待确认目标数量
    targetCompletedCount: number; // 已确认目标数量
    reviewPendingCount: number; // 待评分数量
    reviewCompletedCount: number; // 已评分数量
    resultAuditPendingCount: number; // 待审核结果数量
    resultAuditCompletedCount: number; // 已审核结果数量
    resultConfirmationPendingCount: number; // 待确认结果数量
    resultConfirmationCompletedCount: number; // 已确认结果数量
    resultConfirmationAppealedCount: number; // 已申诉结果数量
    appealPendingCount: number; // 待处理申诉数量
    appealCompletedCount: number; // 已处理申诉数量
  }

  export type PortalPerformanceAssessment =
    HrmPerformanceAssessmentApi.PerformanceAssessment;
  export type ProcessRecord =
    HrmPerformanceAssessmentApi.PerformanceProcessRecord;

  /** 确认请求 */
  export interface ConfirmReq {
    assessmentId: number; // 员工绩效考核编号
    pass: number; // 是否通过
    comment?: string; // 说明
  }

  /** 申诉请求 */
  export interface AppealReq {
    assessmentId: number; // 员工绩效考核编号
    appealReason: string; // 申诉原因
    appealFileUrls?: string[]; // 申诉附件地址列表
    reviewStageIds: number[]; // 退回评分阶段编号列表
  }

  /** 流程响应 */
  export interface ProcessResp {
    id: number; // 编号
    nextStageId?: number; // 下一运行阶段编号
  }

  /** 阶段处理请求 */
  export interface HandleStageReq {
    assessmentId: number; // 员工绩效考核编号
    stageId: number; // 运行阶段编号
    pass: number; // 是否通过
    comment?: string; // 说明
    reviewStageIds?: number[]; // 退回评分阶段编号列表
  }

  /** 指标保存 */
  export interface QuotaSave {
    id?: number; // 编号
    dimensionId?: number; // 员工绩效维度编号
    name?: string; // 指标名称
    description?: string; // 指标说明
    standard?: string; // 标准值
    weight?: number; // 指标权重
    scoreType?: number; // 分数类型
    targetValue?: string; // 目标值
    actualValue?: string; // 实际值
    selfScore?: number; // 自评分数
    reviewerScore?: number; // 评分人得分
    finalScore?: number; // 最终得分
    comment?: string; // 说明
    sort?: number; // 排序
  }

  /** 评分请求 */
  export interface ReviewScoreReq {
    assessmentId: number; // 员工绩效考核编号
    reviewStageId: number; // 评分阶段编号
    comment?: string; // 说明
    selfComment?: string; // 自评说明
    reviewerComment?: string; // 评分人说明
    quotas: QuotaSave[]; // 指标列表
  }

  /** 指标请求 */
  export interface QuotaReq {
    assessmentId: number; // 员工绩效考核编号
    quotas: QuotaSave[]; // 指标列表
  }

  /** 得分预览 */
  export interface ScorePreview {
    score?: number; // 得分
    resultLevel?: string; // 结果等级
    coefficient?: number; // 绩效系数
    stageScore?: number; // 阶段得分
    stageResultLevel?: string; // 阶段结果等级
    cumulativeScore?: number; // 当前累计得分
    cumulativeResultLevel?: string; // 当前累计结果等级；全部评分阶段完成时返回
  }

  /** 驳回请求 */
  export interface ReviewRejectReq {
    assessmentId: number; // 员工绩效考核编号
    reviewStageId: number; // 评分阶段编号
    reason: string; // 驳回原因
  }
}

/** 查询绩效考核分页 */
export function getPerformanceAssessmentPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.AssessmentSummary>
  >('/hrm/portal/performance/assessment/page', { params });
}

/** 查询PerformanceAssessmentTaskCount */
export function getPerformanceAssessmentTaskCount(search?: string) {
  return requestClient.get<HrmPortalPerformanceAssessmentApi.TaskCount>(
    '/hrm/portal/performance/assessment/task-count',
    { params: { search } },
  );
}

/** 查询绩效考核 */
export function getPerformanceAssessment(id: number, stageId?: number) {
  return requestClient.get<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>(
    '/hrm/portal/performance/assessment/get',
    { params: { id, stageId } },
  );
}

/** 查询绩效考核列表 */
export function getPerformanceAssessmentProcessRecordList(
  id: number,
  stageId?: number,
) {
  return requestClient.get<HrmPortalPerformanceAssessmentApi.ProcessRecord[]>(
    '/hrm/portal/performance/assessment/process-record-list',
    { params: { id, stageId } },
  );
}

/** 查询绩效考核分页 */
export function getPerformanceAssessmentFillQuotaTaskPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>
  >('/hrm/portal/performance/assessment/fill-quota-task-page', { params });
}

/** 查询绩效考核分页 */
export function getPerformanceAssessmentTargetConfirmationTaskPage(
  params: PageParam,
) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>
  >('/hrm/portal/performance/assessment/target-confirmation-task-page', {
    params,
  });
}

/** 查询绩效考核分页 */
export function getPerformanceAssessmentReviewTaskPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>
  >('/hrm/portal/performance/assessment/review-task-page', { params });
}

/** 查询绩效考核分页 */
export function getPerformanceAssessmentResultAuditTaskPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>
  >('/hrm/portal/performance/assessment/result-audit-task-page', { params });
}

/** 查询绩效考核分页 */
export function getPerformanceAssessmentResultConfirmationTaskPage(
  params: PageParam,
) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>
  >('/hrm/portal/performance/assessment/result-confirmation-task-page', {
    params,
  });
}

/** 查询绩效考核分页 */
export function getPerformanceAssessmentAppealTaskPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>
  >('/hrm/portal/performance/assessment/appeal-task-page', { params });
}

/** fillPerformanceAssessmentQuota */
export function fillPerformanceAssessmentQuota(
  data: HrmPortalPerformanceAssessmentApi.QuotaReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/fill-quota',
    data,
  );
}

/** 确认PerformanceAssessmentTarget */
export function confirmPerformanceAssessmentTarget(
  data: HrmPortalPerformanceAssessmentApi.ConfirmReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/confirm-target',
    data,
  );
}

/** previewPerformanceAssessmentScore */
export function previewPerformanceAssessmentScore(
  data: HrmPortalPerformanceAssessmentApi.ReviewScoreReq,
) {
  return requestClient.post<HrmPortalPerformanceAssessmentApi.ScorePreview>(
    '/hrm/portal/performance/assessment/score-preview',
    data,
  );
}

/** scorePerformanceAssessment */
export function scorePerformanceAssessment(
  data: HrmPortalPerformanceAssessmentApi.ReviewScoreReq,
) {
  return requestClient.put<HrmPortalPerformanceAssessmentApi.ProcessResp>(
    '/hrm/portal/performance/assessment/score',
    data,
  );
}

/** rejectPerformanceAssessmentReviewStage */
export function rejectPerformanceAssessmentReviewStage(
  data: HrmPortalPerformanceAssessmentApi.ReviewRejectReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/reject-review-stage',
    data,
  );
}

/** handlePerformanceAssessmentResultAudit */
export function handlePerformanceAssessmentResultAudit(
  data: HrmPortalPerformanceAssessmentApi.HandleStageReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/handle-result-audit',
    data,
  );
}

/** 确认PerformanceAssessmentResult */
export function confirmPerformanceAssessmentResult(
  data: HrmPortalPerformanceAssessmentApi.ConfirmReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/confirm-result',
    data,
  );
}

/** submitPerformanceAssessmentAppeal */
export function submitPerformanceAssessmentAppeal(
  data: HrmPortalPerformanceAssessmentApi.AppealReq,
) {
  return requestClient.put<HrmPortalPerformanceAssessmentApi.ProcessResp>(
    '/hrm/portal/performance/assessment/submit-appeal',
    data,
  );
}

/** handlePerformanceAssessmentAppeal */
export function handlePerformanceAssessmentAppeal(
  data: HrmPortalPerformanceAssessmentApi.HandleStageReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/handle-appeal',
    data,
  );
}
