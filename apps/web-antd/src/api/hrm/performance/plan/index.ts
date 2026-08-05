import type { PageParam, PageResult } from '@vben/request';

import type { HrmPerformanceAssessmentTemplateApi } from '../config/assessment-template';
import type { HrmPerformanceResultTemplateApi } from '../config/result-template';

import { requestClient } from '#/api/request';

export namespace HrmPerformancePlanApi {
  /** PerformanceHandlerStage */
  export interface PerformanceHandlerStage {
    type?: number; // 处理人类型
    level?: number; // 上级或部门层级
    employeeId?: number; // 员工编号
  }

  /** PerformanceReviewStage */
  export interface PerformanceReviewStage {
    name?: string; // 阶段名称
    rater?: PerformanceHandlerStage; // 评分人
    weight?: number; // 指标权重
    scoringType?: number; // 评分方式
    visibleContent?: number; // 评分内容可见范围
    requiredSetting?: boolean; // 评语是否必填
    rejectAuthority?: boolean; // 是否允许驳回
  }

  /** PerformanceScope */
  export interface PerformanceScope {
    type?: number; // 范围类型
    employeeIds?: number[]; // 员工编号列表
    deptIds?: number[]; // 部门编号数组
    employeeType?: number; // 聘用形式
    employeeStatuses?: number[]; // 员工状态列表
  }

  /** PerformanceResultConfig */
  export interface PerformanceResultConfig {
    name: string; // 结果模板名称
    levels: HrmPerformanceResultTemplateApi.ResultLevel[]; // 结果等级列表
  }

  /** 绩效计划 */
  export interface PerformancePlan {
    id?: number; // 编号
    name: string; // 计划名称
    cycleType?: number; // 考核周期类型
    cycle?: string; // 考核周期
    quarter?: number; // 季度
    startTime?: number; // 开始日期
    endTime?: number; // 结束日期
    description?: string; // 考核说明
    scopes?: PerformanceScope[]; // 考评范围列表
    assessmentTemplateId?: number; // 考核模板编号
    assessmentConfig?: HrmPerformanceAssessmentTemplateApi.AssessmentConfig; // 考核配置快照
    resultTemplateId?: number; // 结果模板编号
    resultConfig?: PerformanceResultConfig; // 结果配置快照
    quotaSettingType?: number; // 指标设置类型
    targetConfirmation?: boolean; // 是否需要目标确认
    targetConfirmationStage?: PerformanceHandlerStage; // 目标确认节点
    reviewStages?: PerformanceReviewStage[]; // 评分阶段列表
    resultAudit?: boolean; // 是否需要结果审核
    resultAuditStages?: PerformanceHandlerStage[]; // 结果审核节点列表
    resultConfirmation?: boolean; // 是否需要结果确认
    appealStages?: PerformanceHandlerStage[]; // 申诉处理节点列表
    appealTimeoutDays?: number; // 申诉超期天数
    appealTimeoutAction?: number; // 申诉超期处理方式
    syncToSalary?: boolean; // 是否同步薪资
    paidForMonth?: string; // 计薪月份
    assessmentTemplateName?: string; // 考核模板名称
    resultTemplateName?: string; // 结果模板名称
    stageType?: number; // 阶段状态
    status?: number; // 计划状态
    operationType?: number; // 当前操作阶段
    terminateTime?: Date; // 终止时间
    employeeCount?: number; // 员工数量
    finishedCount?: number; // 已完成数量
    scoringReady?: boolean; // 是否可开始评分
    interviewReady?: boolean; // 是否可开始面谈
    archiveReady?: boolean; // 是否可归档
    stageCountMap?: Record<number, number>; // 各阶段员工数量
    createTime?: Date; // 创建时间
  }

  /** PerformanceStageCount */
  export interface PerformanceStageCount {
    stageType?: number; // 阶段状态
    count?: number; // 数量
  }

  /** PerformanceLevelCount */
  export interface PerformanceLevelCount {
    levelName?: string; // 等级名称
    count?: number; // 数量
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
