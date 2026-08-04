import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmPerformanceResultTemplateApi {
  export interface ResultLevel {
    name: string;
    minScore: number;
    maxScore: number;
    coefficient: number;
  }

  export interface ResultTemplate {
    id?: number;
    name: string;
    levels: ResultLevel[];
    status?: number;
    creator?: string;
    creatorName?: string;
    createTime?: Date;
    updateTime?: Date;
  }
}

export function createPerformanceResultTemplate(
  data: HrmPerformanceResultTemplateApi.ResultTemplate,
) {
  return requestClient.post<number>(
    '/hrm/performance/result-template/create',
    data,
  );
}

export function updatePerformanceResultTemplate(
  data: HrmPerformanceResultTemplateApi.ResultTemplate,
) {
  return requestClient.put<boolean>(
    '/hrm/performance/result-template/update',
    data,
  );
}

export function deletePerformanceResultTemplate(id: number) {
  return requestClient.delete<boolean>(
    `/hrm/performance/result-template/delete?id=${id}`,
  );
}

export function deletePerformanceResultTemplateList(ids: number[]) {
  return requestClient.delete<boolean>(
    '/hrm/performance/result-template/delete-list',
    { params: { ids: ids.join(',') } },
  );
}

export function getPerformanceResultTemplate(id: number) {
  return requestClient.get<HrmPerformanceResultTemplateApi.ResultTemplate>(
    `/hrm/performance/result-template/get?id=${id}`,
  );
}

export function getPerformanceResultTemplatePage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPerformanceResultTemplateApi.ResultTemplate>
  >('/hrm/performance/result-template/page', { params });
}

export function getPerformanceResultTemplateSimpleList(params?: {
  status?: number;
}) {
  return requestClient.get<HrmPerformanceResultTemplateApi.ResultTemplate[]>(
    '/hrm/performance/result-template/simple-list',
    { params },
  );
}
