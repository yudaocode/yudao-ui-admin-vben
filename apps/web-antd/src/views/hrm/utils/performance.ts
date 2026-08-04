import type { HrmPerformanceAssessmentTemplateApi } from '#/api/hrm/performance/config/assessment-template';

import {
  HrmPerformanceScoreCalculation,
  HrmPerformanceUpperLimitType,
} from '#/views/hrm/utils/constants';

type AssessmentConfigVO = HrmPerformanceAssessmentTemplateApi.AssessmentConfig;
type AssessmentDimensionVO =
  HrmPerformanceAssessmentTemplateApi.AssessmentDimension;

/** 创建默认考核配置 */
export function createDefaultAssessmentConfig(): AssessmentConfigVO {
  return {
    name: '',
    scoreCalculation: HrmPerformanceScoreCalculation.WEIGHTED,
    upperLimitType: HrmPerformanceUpperLimitType.UNIFIED,
    upperLimitScore: 100,
    dimensions: [],
  };
}

/** 校验考核维度和指标配置 */
export function validateAssessmentConfig(config?: AssessmentConfigVO) {
  const dimensions = config?.dimensions || [];
  if (dimensions.length === 0) {
    return '至少需要一个考核维度';
  }
  const dimensionNames = new Set<string>();
  const quotaNames = new Set<string>();
  let dimensionTotalWeight = 0;
  for (const dimension of dimensions) {
    const dimensionName = dimension.name?.trim();
    if (!dimensionName) {
      return '维度名称不能为空';
    }
    if (dimensionNames.has(dimensionName)) {
      return `维度名称（${dimensionName}）重复`;
    }
    dimensionNames.add(dimensionName);
    if (!isValidWeight(dimension.weight)) {
      return `维度（${dimensionName}）权重必须在 0% 到 100% 之间`;
    }
    dimensionTotalWeight += dimension.weight as number;

    const quotas = dimension.quotas || [];
    if (quotas.length === 0) {
      return `维度（${dimensionName}）至少需要一个指标`;
    }
    let quotaTotalWeight = 0;
    for (const quota of quotas) {
      const quotaName = quota.name?.trim();
      if (!quotaName) {
        return '指标名称不能为空';
      }
      if (!quota.standard?.trim()) {
        return `指标（${quotaName}）考核标准不能为空`;
      }
      if (quotaNames.has(quotaName)) {
        return `指标名称（${quotaName}）重复`;
      }
      quotaNames.add(quotaName);
      if (!isValidWeight(quota.weight)) {
        return `指标（${quotaName}）权重必须在 0% 到 100% 之间`;
      }
      if (quota.scoreType === undefined || quota.scoreType === null) {
        return `指标（${quotaName}）评分方式不能为空`;
      }
      quotaTotalWeight += quota.weight as number;
    }
    if (dimension.allowEdit) {
      if (quotaTotalWeight > 100) {
        return `可编辑维度（${dimensionName}）指标权重总和不能大于 100%`;
      }
    } else if (!isHundred(quotaTotalWeight)) {
      return `维度（${dimensionName}）指标权重总和必须等于 100%`;
    }
  }
  if (!isHundred(dimensionTotalWeight)) {
    return '维度权重总和必须等于 100%';
  }
}

/** 复制考核配置 */
export function cloneAssessmentConfig(
  config: AssessmentConfigVO,
): AssessmentConfigVO {
  return {
    name: config.name,
    scoreCalculation: config.scoreCalculation,
    upperLimitType: config.upperLimitType,
    upperLimitScore: config.upperLimitScore,
    dimensions: (config.dimensions || []).map((dimension) => ({
      ...dimension,
      quotas: (dimension.quotas || []).map((quota) => ({ ...quota })),
    })),
  };
}

/** 获得指标权重合计 */
export function getQuotaWeightTotal(dimension: AssessmentDimensionVO) {
  return (dimension.quotas || []).reduce(
    (total, quota) => total + Number(quota.weight || 0),
    0,
  );
}

/** 判断权重是否为 100% */
export function isHundred(weight: number) {
  return Math.abs(weight - 100) < 0.001;
}

/** 判断绩效评分是否合法 */
export function isValidPerformanceScore(score: number) {
  return (
    Number.isFinite(score) &&
    score >= 0 &&
    score <= 100 &&
    hasAtMostTwoDecimals(score)
  );
}

/** 判断绩效系数是否合法 */
export function isValidPerformanceCoefficient(coefficient: number) {
  return (
    Number.isFinite(coefficient) &&
    coefficient >= 0 &&
    hasAtMostTwoDecimals(coefficient)
  );
}

/** 判断两个数值是否相等 */
export function isSameNumber(left: number, right: number) {
  return Math.abs(left - right) < 0.000001;
}

function isValidWeight(weight?: number) {
  return (
    weight !== undefined && weight !== null && weight >= 0 && weight <= 100
  );
}

function hasAtMostTwoDecimals(value: number) {
  return isSameNumber(value * 100, Math.round(value * 100));
}
