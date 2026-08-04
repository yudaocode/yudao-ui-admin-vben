import type { PageParam, PageResult } from '@vben/request';

import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { requestClient } from '#/api/request';

export namespace HrmPortalPerformanceAssessmentApi {
  export interface AssessmentSummary {
    id: number;
    planId: number;
    name?: string;
    status?: number;
    stageType?: number;
    score?: number;
    resultLevel?: string;
    coefficient?: number;
    resultAuditStatus?: number;
    resultAuditTime?: Date;
    resultAuditReason?: string;
    appealReason?: string;
    appealStatus?: number;
    appealTime?: Date;
    appealComment?: string;
    startTime?: string;
    endTime?: string;
    archiveTime?: Date;
  }

  export interface TaskCount {
    fillPendingCount: number;
    fillCompletedCount: number;
    targetPendingCount: number;
    targetCompletedCount: number;
    reviewPendingCount: number;
    reviewCompletedCount: number;
    resultAuditPendingCount: number;
    resultAuditCompletedCount: number;
    resultConfirmationPendingCount: number;
    resultConfirmationCompletedCount: number;
    resultConfirmationAppealedCount: number;
    appealPendingCount: number;
    appealCompletedCount: number;
  }

  export type Assessment = HrmPerformanceAssessmentApi.PerformanceAssessment;
  export type ProcessRecord =
    HrmPerformanceAssessmentApi.PerformanceProcessRecord;

  export interface ConfirmReq {
    assessmentId: number;
    pass: number;
    comment?: string;
  }

  export interface AppealReq {
    assessmentId: number;
    appealReason: string;
    appealFileUrls?: string[];
    reviewStageIds: number[];
  }

  export interface ProcessResp {
    id: number;
    nextStageId?: number;
  }

  export interface HandleStageReq {
    assessmentId: number;
    stageId: number;
    pass: number;
    comment?: string;
    reviewStageIds?: number[];
  }

  export interface QuotaSave {
    id?: number;
    dimensionId?: number;
    name?: string;
    description?: string;
    standard?: string;
    weight?: number;
    scoreType?: number;
    targetValue?: string;
    actualValue?: string;
    selfScore?: number;
    reviewerScore?: number;
    finalScore?: number;
    comment?: string;
    sort?: number;
  }

  export interface ReviewScoreReq {
    assessmentId: number;
    reviewStageId: number;
    comment?: string;
    selfComment?: string;
    reviewerComment?: string;
    quotas: QuotaSave[];
  }

  export interface QuotaReq {
    assessmentId: number;
    quotas: QuotaSave[];
  }

  export interface ScorePreview {
    score?: number;
    resultLevel?: string;
    coefficient?: number;
    stageScore?: number;
    stageResultLevel?: string;
    cumulativeScore?: number;
    cumulativeResultLevel?: string;
  }

  export interface ReviewRejectReq {
    assessmentId: number;
    reviewStageId: number;
    rejectReason: string;
  }
}

export function getPerformanceAssessmentPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.AssessmentSummary>
  >('/hrm/portal/performance/assessment/page', { params });
}

export function getPerformanceAssessmentTaskCount(search?: string) {
  return requestClient.get<HrmPortalPerformanceAssessmentApi.TaskCount>(
    '/hrm/portal/performance/assessment/task-count',
    { params: { search } },
  );
}

export function getPerformanceAssessment(id: number, stageId?: number) {
  return requestClient.get<HrmPortalPerformanceAssessmentApi.Assessment>(
    '/hrm/portal/performance/assessment/get',
    { params: { id, stageId } },
  );
}

export function getPerformanceAssessmentProcessRecordList(
  id: number,
  stageId?: number,
) {
  return requestClient.get<HrmPortalPerformanceAssessmentApi.ProcessRecord[]>(
    '/hrm/portal/performance/assessment/process-record-list',
    { params: { id, stageId } },
  );
}

export function getPerformanceAssessmentFillQuotaTaskPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.Assessment>
  >('/hrm/portal/performance/assessment/fill-quota-task-page', { params });
}

export function getPerformanceAssessmentTargetConfirmationTaskPage(
  params: PageParam,
) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.Assessment>
  >('/hrm/portal/performance/assessment/target-confirmation-task-page', {
    params,
  });
}

export function getPerformanceAssessmentReviewTaskPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.Assessment>
  >('/hrm/portal/performance/assessment/review-task-page', { params });
}

export function getPerformanceAssessmentResultAuditTaskPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.Assessment>
  >('/hrm/portal/performance/assessment/result-audit-task-page', { params });
}

export function getPerformanceAssessmentResultConfirmationTaskPage(
  params: PageParam,
) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.Assessment>
  >('/hrm/portal/performance/assessment/result-confirmation-task-page', {
    params,
  });
}

export function getPerformanceAssessmentAppealTaskPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPortalPerformanceAssessmentApi.Assessment>
  >('/hrm/portal/performance/assessment/appeal-task-page', { params });
}

export function fillPerformanceAssessmentQuota(
  data: HrmPortalPerformanceAssessmentApi.QuotaReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/fill-quota',
    data,
  );
}

export function confirmPerformanceAssessmentTarget(
  data: HrmPortalPerformanceAssessmentApi.ConfirmReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/confirm-target',
    data,
  );
}

export function previewPerformanceAssessmentScore(
  data: HrmPortalPerformanceAssessmentApi.ReviewScoreReq,
) {
  return requestClient.post<HrmPortalPerformanceAssessmentApi.ScorePreview>(
    '/hrm/portal/performance/assessment/score-preview',
    data,
  );
}

export function scorePerformanceAssessment(
  data: HrmPortalPerformanceAssessmentApi.ReviewScoreReq,
) {
  return requestClient.put<HrmPortalPerformanceAssessmentApi.ProcessResp>(
    '/hrm/portal/performance/assessment/score',
    data,
  );
}

export function rejectPerformanceAssessmentReviewStage(
  data: HrmPortalPerformanceAssessmentApi.ReviewRejectReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/reject-review-stage',
    data,
  );
}

export function handlePerformanceAssessmentResultAudit(
  data: HrmPortalPerformanceAssessmentApi.HandleStageReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/handle-result-audit',
    data,
  );
}

export function confirmPerformanceAssessmentResult(
  data: HrmPortalPerformanceAssessmentApi.ConfirmReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/confirm-result',
    data,
  );
}

export function submitPerformanceAssessmentAppeal(
  data: HrmPortalPerformanceAssessmentApi.AppealReq,
) {
  return requestClient.put<HrmPortalPerformanceAssessmentApi.ProcessResp>(
    '/hrm/portal/performance/assessment/submit-appeal',
    data,
  );
}

export function handlePerformanceAssessmentAppeal(
  data: HrmPortalPerformanceAssessmentApi.HandleStageReq,
) {
  return requestClient.put<boolean>(
    '/hrm/portal/performance/assessment/handle-appeal',
    data,
  );
}
