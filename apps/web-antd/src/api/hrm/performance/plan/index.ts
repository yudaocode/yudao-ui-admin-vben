import type { PageParam, PageResult } from '@vben/request';

import type { HrmPerformanceAssessmentTemplateApi } from '../config/assessment-template';
import type { HrmPerformanceResultTemplateApi } from '../config/result-template';

import { requestClient } from '#/api/request';

export namespace HrmPerformancePlanApi {
  /** PerformanceHandlerStage */
  export interface PerformanceHandlerStage {
    type?: number;
    level?: number;
    employeeId?: number;
  }

  /** PerformanceReviewStage */
  export interface PerformanceReviewStage {
    name?: string;
    rater?: PerformanceHandlerStage;
    weight?: number;
    scoringType?: number;
    visibleContent?: number;
    requiredSetting?: boolean;
    rejectAuthority?: boolean;
  }

  /** PerformanceScope */
  export interface PerformanceScope {
    type?: number;
    employeeIds?: number[];
    deptIds?: number[];
    employeeType?: number;
    employeeStatuses?: number[];
  }

  /** PerformanceResultConfig */
  export interface PerformanceResultConfig {
    name: string;
    levels: HrmPerformanceResultTemplateApi.ResultLevel[];
  }

  /** 绩效计划 */
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

  /** PerformanceStageCount */
  export interface PerformanceStageCount {
    stageType?: number;
    count?: number;
  }

  /** PerformanceLevelCount */
  export interface PerformanceLevelCount {
    levelName?: string;
    count?: number;
  }
}

/** 新增绩效计划 */
export function createPerformancePlan(
  data: HrmPerformancePlanApi.PerformancePlan,
) {
  return requestClient.post<number>('/hrm/performance/plan/create', data);
}

/** 修改绩效计划 */
export function updatePerformancePlan(
  data: HrmPerformancePlanApi.PerformancePlan,
) {
  return requestClient.put<boolean>('/hrm/performance/plan/update', data);
}

/** 删除绩效计划 */
export function deletePerformancePlan(id: number) {
  return requestClient.delete<boolean>(`/hrm/performance/plan/delete?id=${id}`);
}

/** 查询绩效计划 */
export function getPerformancePlan(id: number) {
  return requestClient.get<HrmPerformancePlanApi.PerformancePlan>(
    `/hrm/performance/plan/get?id=${id}`,
  );
}

/** 查询绩效计划分页 */
export function getPerformancePlanPage(params: PageParam) {
  return requestClient.get<PageResult<HrmPerformancePlanApi.PerformancePlan>>(
    '/hrm/performance/plan/page',
    { params },
  );
}

/** startPerformancePlan */
export function startPerformancePlan(id: number) {
  return requestClient.post<boolean>(`/hrm/performance/plan/start?id=${id}`);
}

/** openPerformancePlanScoring */
export function openPerformancePlanScoring(id: number) {
  return requestClient.post<boolean>(
    `/hrm/performance/plan/open-scoring?id=${id}`,
  );
}

/** startPerformancePlanInterview */
export function startPerformancePlanInterview(id: number) {
  return requestClient.post<boolean>(
    `/hrm/performance/plan/start-interview?id=${id}`,
  );
}

/** archivePerformancePlan */
export function archivePerformancePlan(id: number) {
  return requestClient.post<boolean>(`/hrm/performance/plan/archive?id=${id}`);
}

/** terminatePerformancePlan */
export function terminatePerformancePlan(id: number) {
  return requestClient.post<boolean>(
    `/hrm/performance/plan/terminate?id=${id}`,
  );
}

/** 查询PerformancePlanStatusCount */
export function getPerformancePlanStatusCount(params: PageParam) {
  return requestClient.get<Record<number, number>>(
    '/hrm/performance/plan/status-count',
    { params },
  );
}

/** 查询PerformancePlanStageCount */
export function getPerformancePlanStageCount(planId: number) {
  return requestClient.get<HrmPerformancePlanApi.PerformanceStageCount[]>(
    `/hrm/performance/plan/stage-count?planId=${planId}`,
  );
}

/** 查询PerformancePlanLevelCount */
export function getPerformancePlanLevelCount(planId: number) {
  return requestClient.get<HrmPerformancePlanApi.PerformanceLevelCount[]>(
    `/hrm/performance/plan/level-count?planId=${planId}`,
  );
}
