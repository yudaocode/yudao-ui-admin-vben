import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmPerformanceResultTemplateApi {
  /** 结果等级 */
  export interface ResultLevel {
    name: string; // 等级名称
    minScore: number; // 最低分数
    maxScore: number; // 最高分数
    coefficient: number; // 绩效系数
  }

  /** 考核结果模板 */
  export interface PerformanceResultTemplate {
    id?: number; // 编号
    name: string; // 结果模板名称
    levels: ResultLevel[]; // 结果等级列表
    status?: number; // 状态
    creator?: string; // 创建人
    creatorName?: string; // 创建人名称
    createTime?: Date; // 创建时间
    updateTime?: Date; // 更新时间
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
