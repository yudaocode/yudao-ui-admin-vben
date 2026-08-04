import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmPerformanceResultTemplateApi {
  /** 结果等级 */
  export interface ResultLevel {
    name: string;
    minScore: number;
    maxScore: number;
    coefficient: number;
  }

  /** 考核结果模板 */
  export interface PerformanceResultTemplate {
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

/** 新增考核结果模板 */
export function createPerformanceResultTemplate(
  data: HrmPerformanceResultTemplateApi.PerformanceResultTemplate,
) {
  return requestClient.post<number>(
    '/hrm/performance/result-template/create',
    data,
  );
}

/** 修改考核结果模板 */
export function updatePerformanceResultTemplate(
  data: HrmPerformanceResultTemplateApi.PerformanceResultTemplate,
) {
  return requestClient.put<boolean>(
    '/hrm/performance/result-template/update',
    data,
  );
}

/** 删除考核结果模板 */
export function deletePerformanceResultTemplate(id: number) {
  return requestClient.delete<boolean>(
    `/hrm/performance/result-template/delete?id=${id}`,
  );
}

/** 批量删除考核结果模板 */
export function deletePerformanceResultTemplateList(ids: number[]) {
  return requestClient.delete<boolean>(
    '/hrm/performance/result-template/delete-list',
    { params: { ids: ids.join(',') } },
  );
}

/** 查询考核结果模板 */
export function getPerformanceResultTemplate(id: number) {
  return requestClient.get<HrmPerformanceResultTemplateApi.PerformanceResultTemplate>(
    `/hrm/performance/result-template/get?id=${id}`,
  );
}

/** 查询考核结果模板分页 */
export function getPerformanceResultTemplatePage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmPerformanceResultTemplateApi.PerformanceResultTemplate>
  >('/hrm/performance/result-template/page', { params });
}

/** 查询考核结果模板精简列表 */
export function getPerformanceResultTemplateSimpleList(params?: {
  status?: number;
}) {
  return requestClient.get<
    HrmPerformanceResultTemplateApi.PerformanceResultTemplate[]
  >('/hrm/performance/result-template/simple-list', { params });
}
