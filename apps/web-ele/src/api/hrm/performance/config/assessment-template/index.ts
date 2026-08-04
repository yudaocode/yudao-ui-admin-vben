import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmPerformanceAssessmentTemplateApi {
  /** AssessmentQuota */
  export interface AssessmentQuota {
    name?: string;
    illustrate?: string;
    standard?: string;
    weight?: number;
    scoreType?: number;
  }

  /** AssessmentDimension */
  export interface AssessmentDimension {
    name?: string;
    quotaType?: number;
    weight?: number;
    remark?: string;
    allowEdit?: boolean;
    quotas?: AssessmentQuota[];
  }

  /** AssessmentConfig */
  export interface AssessmentConfig {
    name: string;
    scoreCalculation: number;
    upperLimitType: number;
    upperLimitScore: number;
    dimensions?: AssessmentDimension[];
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
