import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmPerformanceAssessmentTemplateApi {
  /** AssessmentQuota */
  export interface AssessmentQuota {
    name?: string; // 指标名称
    illustrate?: string; // 指标说明
    standard?: string; // 标准值
    weight?: number; // 指标权重
    scoreType?: number; // 分数类型
  }

  /** AssessmentDimension */
  export interface AssessmentDimension {
    name?: string; // 维度名称
    quotaType?: number; // 指标类型
    weight?: number; // 指标权重
    remark?: string; // 备注
    allowEdit?: boolean; // 是否允许编辑
    quotas?: AssessmentQuota[]; // 指标列表
  }

  /** AssessmentConfig */
  export interface AssessmentConfig {
    name: string; // 模板名称
    scoreCalculation: number; // 计分方式
    upperLimitType: number; // 分数上限类型
    upperLimitScore: number; // 分数上限
    dimensions?: AssessmentDimension[]; // 考核维度列表
  }

  /** 考核指标模板 */
  export interface PerformanceAssessmentTemplate extends AssessmentConfig {
    id?: number;
    illustrate?: string;
    dimensionCount?: number;
    quotaCount?: number;
    creator?: string;
    creatorName?: string;
    createTime?: Date;
    updateTime?: Date;
  }
}

/** 新增考核指标模板 */
export function createPerformanceAssessmentTemplate(
  data: HrmPerformanceAssessmentTemplateApi.PerformanceAssessmentTemplate,
) {
  return requestClient.post<number>(
    '/hrm/performance/assessment-template/create',
    data,
  );
}

/** 修改考核指标模板 */
export function updatePerformanceAssessmentTemplate(
  data: HrmPerformanceAssessmentTemplateApi.PerformanceAssessmentTemplate,
) {
  return requestClient.put<boolean>(
    '/hrm/performance/assessment-template/update',
    data,
  );
}

/** 删除考核指标模板 */
export function deletePerformanceAssessmentTemplate(id: number) {
  return requestClient.delete<boolean>(
    `/hrm/performance/assessment-template/delete?id=${id}`,
  );
}

/** 批量删除考核指标模板 */
export function deletePerformanceAssessmentTemplateList(ids: number[]) {
  return requestClient.delete<boolean>(
    '/hrm/performance/assessment-template/delete-list',
    { params: { ids: ids.join(',') } },
  );
}

/** 查询考核指标模板 */
export function getPerformanceAssessmentTemplate(id: number) {
  return requestClient.get<HrmPerformanceAssessmentTemplateApi.PerformanceAssessmentTemplate>(
    `/hrm/performance/assessment-template/get?id=${id}`,
  );
}

/** 查询考核指标模板分页 */
export function getPerformanceAssessmentTemplatePage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPerformanceAssessmentTemplateApi.PerformanceAssessmentTemplate>
  >('/hrm/performance/assessment-template/page', { params });
}

/** 查询考核指标模板精简列表 */
export function getPerformanceAssessmentTemplateSimpleList() {
  return requestClient.get<
    HrmPerformanceAssessmentTemplateApi.PerformanceAssessmentTemplate[]
  >('/hrm/performance/assessment-template/simple-list');
}
