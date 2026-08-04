import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmPerformanceAssessmentApi {
  /** PerformanceArchivePlan */
  export interface PerformanceArchivePlan {
    id: number;
    name: string;
  }

  /** PerformanceAssessmentQuotaScore */
  export interface PerformanceAssessmentQuotaScore {
    id?: number;
    assessmentStageId?: number;
    assessmentQuotaId?: number;
    score?: number;
    comment?: string;
  }

  /** PerformanceAssessmentStage */
  export interface PerformanceAssessmentStage {
    id?: number;
    assessmentId?: number;
    type?: number;
    handlerEmployeeId?: number;
    handlerName?: string;
    name?: string;
    raterType?: number;
    weight?: number;
    scoringType?: number;
    visibleContent?: number;
    requiredSetting?: boolean;
    rejectAuthority?: boolean;
    sort?: number;
    status?: number;
    score?: number;
    resultLevel?: string;
    comment?: string;
    rejectReason?: string;
    submitTime?: Date;
    deadlineTime?: Date;
    canHandle?: boolean;
    canScore?: boolean;
    quotaScoreList?: PerformanceAssessmentQuotaScore[];
  }

  /** PerformanceAssessmentQuota */
  export interface PerformanceAssessmentQuota {
    id?: number;
    assessmentId?: number;
    dimensionId?: number;
    allowEdit?: boolean;
    preset?: boolean;
    dimensionName?: string;
    name?: string;
    description?: string;
    standard?: string;
    dimensionWeight?: number;
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

  /** PerformanceAssessmentDimension */
  export interface PerformanceAssessmentDimension {
    id?: number;
    assessmentId?: number;
    name?: string;
    quotaType?: number;
    weight?: number;
    remark?: string;
    allowEdit?: boolean;
    sort?: number;
  }

  /** 绩效考核 */
  export interface PerformanceAssessment {
    id?: number;
    planId?: number;
    name?: string;
    cycleType?: number;
    cycle?: string;
    startTime?: Date;
    endTime?: Date;
    upperLimitScore?: number;
    employeeId?: number;
    employeeName?: string;
    jobNumber?: string;
    mobile?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    employeeType?: number;
    employeeStatus?: number;
    currentHandlerName?: string;
    status?: number;
    processStatus?: number;
    stageType?: number;
    stageSort?: number;
    score?: number;
    resultLevel?: string;
    coefficient?: number;
    targetConfirmationEmployeeName?: string;
    targetConfirmationResult?: number;
    targetConfirmationComment?: string;
    targetConfirmationTime?: Date;
    canConfirmTarget?: boolean;
    selfComment?: string;
    reviewerComment?: string;
    resultComment?: string;
    resultConfirmationTime?: Date;
    resultAuditStatus?: number;
    resultAuditTime?: Date;
    resultAuditReason?: string;
    appealReason?: string;
    appealFileUrls?: string[];
    appealReviewStageIds?: number[];
    appealSubmitTime?: Date;
    appealStatus?: number;
    appealTime?: Date;
    appealComment?: string;
    archiveTime?: Date;
    dimensions?: PerformanceAssessmentDimension[];
    quotas?: PerformanceAssessmentQuota[];
    reviewStages?: PerformanceAssessmentStage[];
    currentReviewStage?: PerformanceAssessmentStage;
    stages?: PerformanceAssessmentStage[];
    currentStage?: PerformanceAssessmentStage;
    createTime?: Date;
  }

  /** PerformanceArchiveEmployee */
  export interface PerformanceArchiveEmployee {
    employeeId: number;
    employeeName: string;
    jobNumber?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    mobile?: string;
    employeeStatus?: number;
    employeeType?: number;
    latestAssessmentId?: number;
    latestPlanName?: string;
    latestScore?: number;
    latestResultLevel?: string;
    assessmentCount: number;
  }

  /** PerformanceProcessRecord */
  export interface PerformanceProcessRecord {
    title?: string;
    content?: string;
    source?: 'ACTION' | 'BUSINESS' | 'STAGE';
    status?: number;
    operatorName?: string;
    operateTime?: Date;
    fileUrls?: string[];
  }

  export type AssessmentQuota = PerformanceAssessmentQuota;
  export type AssessmentStage = PerformanceAssessmentStage;
}

/** addPerformancePlanEmployees */
export function addPerformancePlanEmployees(data: {
  employeeIds?: number[];
  planId?: number;
}) {
  return requestClient.post<boolean>(
    '/hrm/performance/assessment/create-list',
    data,
  );
}

/** removePerformancePlanEmployees */
export function removePerformancePlanEmployees(data: {
  employeeIds?: number[];
  planId?: number;
}) {
  return requestClient.delete<boolean>(
    '/hrm/performance/assessment/delete-list',
    { data },
  );
}

/** 查询绩效考核分页 */
export function getPerformanceAssessmentPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPerformanceAssessmentApi.PerformanceAssessment>
  >('/hrm/performance/assessment/page', { params });
}

/** 查询绩效计划列表 */
export function getPerformancePlanUnassignedEmployeeIdList(planId: number) {
  return requestClient.get<number[]>(
    '/hrm/performance/assessment/unassigned-employee-id-list',
    { params: { planId } },
  );
}

/** 查询绩效考核 */
export function getPerformanceAssessment(id: number) {
  return requestClient.get<HrmPerformanceAssessmentApi.PerformanceAssessment>(
    `/hrm/performance/assessment/get?id=${id}`,
  );
}

/** 查询绩效考核列表 */
export function getPerformanceAssessmentProcessRecordList(id: number) {
  return requestClient.get<
    HrmPerformanceAssessmentApi.PerformanceProcessRecord[]
  >('/hrm/performance/assessment/process-record-list', { params: { id } });
}

/** 查询绩效考核分页 */
export function getPerformanceAssessmentArchivePage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPerformanceAssessmentApi.PerformanceAssessment>
  >('/hrm/performance/assessment/archive-page', { params });
}

/** 查询员工档案分页 */
export function getPerformanceArchiveEmployeePage(
  params: PageParam & { search?: string },
) {
  return requestClient.get<
    PageResult<HrmPerformanceAssessmentApi.PerformanceArchiveEmployee>
  >('/hrm/performance/assessment/archive-employee-page', { params });
}

/** 查询PerformanceAssessmentArchive */
export function getPerformanceAssessmentArchive(id: number) {
  return requestClient.get<HrmPerformanceAssessmentApi.PerformanceAssessment>(
    `/hrm/performance/assessment/archive-get?id=${id}`,
  );
}

/** 查询绩效考核列表 */
export function getPerformanceAssessmentArchiveProcessRecordList(id: number) {
  return requestClient.get<
    HrmPerformanceAssessmentApi.PerformanceProcessRecord[]
  >('/hrm/performance/assessment/archive-process-record-list', {
    params: { id },
  });
}

/** 查询PerformanceArchivePlanSimpleList */
export function getPerformanceArchivePlanSimpleList() {
  return requestClient.get<
    HrmPerformanceAssessmentApi.PerformanceArchivePlan[]
  >('/hrm/performance/assessment/archive-plan-simple-list');
}

/** 删除PerformanceArchiveRecords */
export function deletePerformanceArchiveRecords(ids: number[]) {
  return requestClient.delete<boolean>(
    '/hrm/performance/assessment/archive-delete',
    { params: { ids: ids.join(',') } },
  );
}

/** 删除员工档案 */
export function deletePerformanceArchiveEmployeeRecords(employeeIds: number[]) {
  return requestClient.delete<boolean>(
    '/hrm/performance/assessment/archive-employee-delete',
    { params: { employeeIds: employeeIds.join(',') } },
  );
}
