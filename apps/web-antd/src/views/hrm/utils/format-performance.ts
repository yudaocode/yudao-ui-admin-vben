import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { formatDateTime } from '@vben/utils';

import {
  HrmPerformanceAppealTimeoutAction,
  HrmPerformanceCycleTypeOptions,
  HrmPerformanceRaterType,
} from '#/views/hrm/utils/constants';

/** 格式化绩效评分人层级 */
export function formatHrmPerformanceRaterLevel(
  raterType: number | undefined,
  level: number,
): string {
  if (raterType === HrmPerformanceRaterType.SUPERIOR) {
    return level === 1 ? '直属上级' : `第 ${level} 级上级`;
  }
  return level === 1 ? '直属部门负责人' : `第 ${level} 级部门负责人`;
}

/** 格式化绩效评分阶段名称 */
export function formatHrmPerformanceReviewStageName(
  stage: HrmPerformancePlanApi.PerformanceReviewStage,
): string {
  if (stage.rater?.type === HrmPerformanceRaterType.SELF) {
    return '员工自评';
  }
  if (
    stage.rater?.type === HrmPerformanceRaterType.SUPERIOR ||
    stage.rater?.type === HrmPerformanceRaterType.DEPT_LEADER
  ) {
    return `${formatHrmPerformanceRaterLevel(stage.rater.type, stage.rater.level || 1)}评分`;
  }
  return '指定员工评分';
}

/** 格式化绩效计划周期 */
export function formatHrmPerformancePlanCycle(
  plan: HrmPerformancePlanApi.PerformancePlan,
): string {
  return (
    [plan.cycle, plan.quarter ? `第 ${plan.quarter} 季度` : '']
      .filter(Boolean)
      .join(' / ') || '-'
  );
}

/** 格式化绩效考核周期类型 */
export function formatHrmPerformanceCycleType(type?: number): string {
  return (
    HrmPerformanceCycleTypeOptions.find((item) => item.value === type)?.label ||
    '-'
  );
}

/** 格式化绩效指标制定方式 */
export function formatHrmPerformanceQuotaSettingType(type?: number): string {
  if (type === 1) return '系统制定';
  return type === 2 ? '员工制定' : '-';
}

/** 格式化绩效申诉超期处理方式 */
export function formatHrmPerformanceAppealTimeout(
  plan: HrmPerformancePlanApi.PerformancePlan,
): string {
  if (!plan.resultConfirmation || !plan.appealTimeoutDays) return '-';
  const action = {
    [HrmPerformanceAppealTimeoutAction.REJECT]: '自动拒绝',
    [HrmPerformanceAppealTimeoutAction.APPROVE]: '自动通过',
  }[plan.appealTimeoutAction || 0];
  return action ? `超过 ${plan.appealTimeoutDays} 天未处理，${action}` : '-';
}

/** 格式化绩效评分人类型 */
export function formatHrmPerformanceRaterType(type?: number): string {
  return (
    {
      [HrmPerformanceRaterType.SUPERIOR]: '上级',
      [HrmPerformanceRaterType.DEPT_LEADER]: '部门负责人',
      [HrmPerformanceRaterType.SPECIFIED]: '指定评分人',
      [HrmPerformanceRaterType.SELF]: '被考核人',
    }[type || 0] || '-'
  );
}

/** 格式化 HRM 日期范围 */
export function formatHrmDateRange(
  startDate?: Date | number | string,
  endDate?: Date | number | string,
): string {
  if (!startDate && !endDate) return '-';
  const start = startDate ? formatDateTime(startDate).slice(0, 10) : '';
  const end = endDate ? formatDateTime(endDate).slice(0, 10) : '';
  return `${start} 至 ${end}`;
}
