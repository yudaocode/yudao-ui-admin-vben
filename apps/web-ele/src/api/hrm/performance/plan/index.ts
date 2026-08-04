import type { PageParam, PageResult } from '@vben/request';

import type { HrmPerformanceAssessmentTemplateApi } from '../config/assessment-template';
import type { HrmPerformanceResultTemplateApi } from '../config/result-template';

import { requestClient } from '#/api/request';

export namespace HrmPerformancePlanApi {
  export interface PerformanceHandlerStage {
    type?: number;
    level?: number;
    employeeId?: number;
  }

  export interface PerformanceReviewStage {
    name?: string;
    rater?: PerformanceHandlerStage;
    weight?: number;
    scoringType?: number;
    visibleContent?: number;
    requiredSetting?: boolean;
    rejectAuthority?: boolean;
  }

  export interface PerformanceScope {
    type?: number;
    employeeIds?: number[];
    deptIds?: number[];
    employeeType?: number;
    employeeStatuses?: number[];
  }

  export interface PerformanceResultConfig {
    name: string;
    levels: HrmPerformanceResultTemplateApi.ResultLevel[];
  }

  export interface PerformancePlan {
    id?: number;
    name: string;
    cycleType?: number;
    cycle?: string;
    quarter?: number;
    startTime?: number;
    endTime?: number;
    description?: string;
    scopes?: PerformanceScope[];
    assessmentTemplateId?: number;
    assessmentConfig?: HrmPerformanceAssessmentTemplateApi.AssessmentConfig;
    resultTemplateId?: number;
    resultConfig?: PerformanceResultConfig;
    quotaSettingType?: number;
    targetConfirmation?: boolean;
    targetConfirmationStage?: PerformanceHandlerStage;
    reviewStages?: PerformanceReviewStage[];
    resultAudit?: boolean;
    resultAuditStages?: PerformanceHandlerStage[];
    resultConfirmation?: boolean;
    appealStages?: PerformanceHandlerStage[];
    appealTimeoutDays?: number;
    appealTimeoutAction?: number;
    syncToSalary?: boolean;
    paidForMonth?: string;
    assessmentTemplateName?: string;
    resultTemplateName?: string;
    stageType?: number;
    status?: number;
    operationType?: number;
    terminateTime?: Date;
    employeeCount?: number;
    finishedCount?: number;
    scoringReady?: boolean;
    interviewReady?: boolean;
    archiveReady?: boolean;
    stageCountMap?: Record<number, number>;
    createTime?: Date;
  }

  export interface PerformanceStageCount {
    stageType?: number;
    count?: number;
  }

  export interface PerformanceLevelCount {
    levelName?: string;
    count?: number;
  }
}

export function createPerformancePlan(
  data: HrmPerformancePlanApi.PerformancePlan,
) {
  return requestClient.post<number>('/hrm/performance/plan/create', data);
}

export function updatePerformancePlan(
  data: HrmPerformancePlanApi.PerformancePlan,
) {
  return requestClient.put<boolean>('/hrm/performance/plan/update', data);
}

export function deletePerformancePlan(id: number) {
  return requestClient.delete<boolean>(`/hrm/performance/plan/delete?id=${id}`);
}

export function getPerformancePlan(id: number) {
  return requestClient.get<HrmPerformancePlanApi.PerformancePlan>(
    `/hrm/performance/plan/get?id=${id}`,
  );
}

export function getPerformancePlanPage(params: PageParam) {
  return requestClient.get<PageResult<HrmPerformancePlanApi.PerformancePlan>>(
    '/hrm/performance/plan/page',
    { params },
  );
}

export function startPerformancePlan(id: number) {
  return requestClient.post<boolean>(`/hrm/performance/plan/start?id=${id}`);
}

export function openPerformancePlanScoring(id: number) {
  return requestClient.post<boolean>(
    `/hrm/performance/plan/open-scoring?id=${id}`,
  );
}

export function startPerformancePlanInterview(id: number) {
  return requestClient.post<boolean>(
    `/hrm/performance/plan/start-interview?id=${id}`,
  );
}

export function archivePerformancePlan(id: number) {
  return requestClient.post<boolean>(`/hrm/performance/plan/archive?id=${id}`);
}

export function terminatePerformancePlan(id: number) {
  return requestClient.post<boolean>(
    `/hrm/performance/plan/terminate?id=${id}`,
  );
}

export function getPerformancePlanStatusCount(params: PageParam) {
  return requestClient.get<Record<number, number>>(
    '/hrm/performance/plan/status-count',
    { params },
  );
}

export function getPerformancePlanStageCount(planId: number) {
  return requestClient.get<HrmPerformancePlanApi.PerformanceStageCount[]>(
    `/hrm/performance/plan/stage-count?planId=${planId}`,
  );
}

export function getPerformancePlanLevelCount(planId: number) {
  return requestClient.get<HrmPerformancePlanApi.PerformanceLevelCount[]>(
    `/hrm/performance/plan/level-count?planId=${planId}`,
  );
}
