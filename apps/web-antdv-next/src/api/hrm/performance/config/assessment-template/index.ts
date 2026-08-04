import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmPerformanceAssessmentTemplateApi {
  export interface AssessmentQuota {
    name?: string;
    illustrate?: string;
    standard?: string;
    weight?: number;
    scoreType?: number;
  }

  export interface AssessmentDimension {
    name?: string;
    quotaType?: number;
    weight?: number;
    remark?: string;
    allowEdit?: boolean;
    quotas?: AssessmentQuota[];
  }

  export interface AssessmentConfig {
    name: string;
    scoreCalculation: number;
    upperLimitType: number;
    upperLimitScore: number;
    dimensions?: AssessmentDimension[];
  }

  export interface AssessmentTemplate extends AssessmentConfig {
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

export function createPerformanceAssessmentTemplate(
  data: HrmPerformanceAssessmentTemplateApi.AssessmentTemplate,
) {
  return requestClient.post<number>(
    '/hrm/performance/assessment-template/create',
    data,
  );
}

export function updatePerformanceAssessmentTemplate(
  data: HrmPerformanceAssessmentTemplateApi.AssessmentTemplate,
) {
  return requestClient.put<boolean>(
    '/hrm/performance/assessment-template/update',
    data,
  );
}

export function deletePerformanceAssessmentTemplate(id: number) {
  return requestClient.delete<boolean>(
    `/hrm/performance/assessment-template/delete?id=${id}`,
  );
}

export function deletePerformanceAssessmentTemplateList(ids: number[]) {
  return requestClient.delete<boolean>(
    '/hrm/performance/assessment-template/delete-list',
    { params: { ids: ids.join(',') } },
  );
}

export function getPerformanceAssessmentTemplate(id: number) {
  return requestClient.get<HrmPerformanceAssessmentTemplateApi.AssessmentTemplate>(
    `/hrm/performance/assessment-template/get?id=${id}`,
  );
}

export function getPerformanceAssessmentTemplatePage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPerformanceAssessmentTemplateApi.AssessmentTemplate>
  >('/hrm/performance/assessment-template/page', { params });
}

export function getPerformanceAssessmentTemplateSimpleList() {
  return requestClient.get<
    HrmPerformanceAssessmentTemplateApi.AssessmentTemplate[]
  >('/hrm/performance/assessment-template/simple-list');
}
