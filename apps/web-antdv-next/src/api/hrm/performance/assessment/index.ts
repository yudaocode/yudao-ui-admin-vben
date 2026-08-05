import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmPerformanceAssessmentApi {
  /** PerformanceArchivePlan */
  export interface PerformanceArchivePlan {
    id: number; // 编号
    name: string; // 绩效计划名称
  }

  /** PerformanceAssessmentQuotaScore */
  export interface PerformanceAssessmentQuotaScore {
    id?: number; // 编号
    assessmentStageId?: number; // 员工评分阶段编号
    assessmentQuotaId?: number; // 员工绩效指标编号
    score?: number; // 得分
    comment?: string; // 说明
  }

  /** PerformanceAssessmentStage */
  export interface PerformanceAssessmentStage {
    id?: number; // 编号
    assessmentId?: number; // 员工绩效考核编号
    type?: number; // 业务阶段类型
    handlerEmployeeId?: number; // 处理员工编号
    handlerName?: string; // 处理人姓名
    name?: string; // 阶段名称
    raterType?: number; // 评分人类型
    weight?: number; // 指标权重
    scoringType?: number; // 评分方式
    visibleContent?: number; // 评分内容可见范围
    requiredSetting?: boolean; // 评语是否必填
    rejectAuthority?: boolean; // 是否允许驳回
    sort?: number; // 排序
    status?: number; // 阶段状态
    score?: number; // 得分
    resultLevel?: string; // 结果等级
    comment?: string; // 说明
    rejectReason?: string; // 驳回原因
    submitTime?: Date; // 提交时间
    deadlineTime?: Date; // 截止时间
    canHandle?: boolean; // 是否可处理
    canScore?: boolean; // 是否可评分
    quotaScoreList?: PerformanceAssessmentQuotaScore[]; // 指标评分列表
  }

  /** PerformanceAssessmentQuota */
  export interface PerformanceAssessmentQuota {
    id?: number; // 编号
    assessmentId?: number; // 员工绩效考核编号
    dimensionId?: number; // 员工绩效维度编号
    allowEdit?: boolean; // 是否允许编辑
    preset?: boolean; // 预设值
    dimensionName?: string; // 维度名称
    name?: string; // 指标名称
    description?: string; // 指标说明
    standard?: string; // 标准值
    dimensionWeight?: number; // 维度权重
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

  /** PerformanceAssessmentDimension */
  export interface PerformanceAssessmentDimension {
    id?: number; // 编号
    assessmentId?: number; // 员工绩效考核编号
    name?: string; // 维度名称
    quotaType?: number; // 指标类型
    weight?: number; // 指标权重
    remark?: string; // 备注
    allowEdit?: boolean; // 是否允许编辑
    sort?: number; // 排序
  }

  /** 绩效考核 */
  export interface PerformanceAssessment {
    id?: number; // 编号
    planId?: number; // 绩效计划编号
    name?: string; // 绩效计划名称
    cycleType?: number; // 考核周期类型
    cycle?: string; // 考核周期
    startTime?: Date; // 开始日期
    endTime?: Date; // 结束日期
    upperLimitScore?: number; // 分数上限
    employeeId?: number; // 员工编号
    employeeName?: string; // 员工姓名
    jobNumber?: string; // 工号
    mobile?: string; // 手机号
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    postName?: string; // 职位名称
    employeeType?: number; // 聘用形式
    employeeStatus?: number; // 员工状态
    currentHandlerName?: string; // 当前处理人
    status?: number; // 考核状态
    processStatus?: number; // 激活状态
    stageType?: number; // 阶段状态
    stageSort?: number; // 阶段排序
    score?: number; // 得分
    resultLevel?: string; // 结果等级
    coefficient?: number; // 绩效系数
    targetConfirmationEmployeeName?: string; // 目标确认员工姓名
    targetConfirmationResult?: number; // 目标确认结果
    targetConfirmationComment?: string; // 目标确认意见
    targetConfirmationTime?: Date; // 目标确认时间
    canConfirmTarget?: boolean; // 是否可确认目标
    selfComment?: string; // 自评说明
    reviewerComment?: string; // 评分人说明
    resultComment?: string; // 结果说明
    resultConfirmationTime?: Date; // 结果确认时间
    resultAuditStatus?: number; // 结果审核状态
    resultAuditTime?: Date; // 结果审核时间
    resultAuditReason?: string; // 结果审核意见
    appealReason?: string; // 申诉原因
    appealFileUrls?: string[]; // 申诉附件地址列表
    appealReviewStageIds?: number[]; // 申诉退回评分阶段编号列表
    appealSubmitTime?: Date; // 申诉提交时间
    appealStatus?: number; // 申诉状态
    appealTime?: Date; // 申诉处理时间
    appealComment?: string; // 申诉处理意见
    archiveTime?: Date; // 归档时间
    dimensions?: PerformanceAssessmentDimension[]; // 考核维度列表
    quotas?: PerformanceAssessmentQuota[]; // 指标列表
    reviewStages?: PerformanceAssessmentStage[]; // 评分阶段列表
    currentReviewStage?: PerformanceAssessmentStage; // 当前评分阶段
    stages?: PerformanceAssessmentStage[]; // 运行阶段列表
    currentStage?: PerformanceAssessmentStage; // 当前待处理阶段
    createTime?: Date; // 创建时间
  }

  /** PerformanceArchiveEmployee */
  export interface PerformanceArchiveEmployee {
    employeeId: number; // 员工编号
    employeeName: string; // 员工姓名
    jobNumber?: string; // 工号
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    postName?: string; // 职位名称
    mobile?: string; // 手机号
    employeeStatus?: number; // 员工状态
    employeeType?: number; // 聘用形式
    latestAssessmentId?: number; // 最近考核编号
    latestPlanName?: string; // 最近考核计划
    latestScore?: number; // 最近绩效评分
    latestResultLevel?: string; // 最近绩效等级
    assessmentCount: number; // 考核次数
  }

  /** PerformanceProcessRecord */
  export interface PerformanceProcessRecord {
    title?: string; // 标题
    content?: string; // 事项内容
    source?: 'ACTION' | 'BUSINESS' | 'STAGE'; // 来源
    status?: number; // 流程状态
    operatorName?: string; // 操作人姓名
    operateTime?: Date; // 操作时间
    fileUrls?: string[]; // 附件地址数组
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
export function getPerformanceArchiveEmployeePage(params: PageParam) {
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
