import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace KeywordApi {
  /** 关键词信息 */
  export interface Keyword {
    id: number; // 编号
    label: string; // 标签
    assistantId: number; // 助理ID
    keyword?: string; // 关键词
    userId?: number; // 用户编号
    description: string; // 分类说明
    aiInstruction: string; // AI指南
  }
}

/** 查询关键词分页 */
export function getKeywordPage(params: PageParam) {
  return requestClient.get<PageResult<KeywordApi.Keyword>>(
    '/mpr/keyword/page',
    { params },
  );
}

/** 查询关键词详情 */
export function getKeyword(id: number) {
  return requestClient.get<KeywordApi.Keyword>(`/mpr/keyword/get?id=${id}`);
}

/** 新增关键词 */
export function createKeyword(data: KeywordApi.Keyword) {
  return requestClient.post('/mpr/keyword/create', data);
}
/** 新增关键词 */
export function createOrGetKeyword(data: KeywordApi.Keyword) {
  return requestClient.post('/mpr/keyword/createOrGet', data);
}
/** 修改关键词 */
export function updateKeyword(data: KeywordApi.Keyword) {
  return requestClient.put('/mpr/keyword/update', data);
}

/** 删除关键词 */
export function deleteKeyword(id: number) {
  return requestClient.delete(`/mpr/keyword/delete?id=${id}`);
}

/** 批量删除关键词 */
export function deleteKeywordList(ids: number[]) {
  return requestClient.delete(`/mpr/keyword/delete-list?ids=${ids.join(',')}`);
}

/** 导出关键词 */
export function exportKeyword(params: any) {
  return requestClient.download('/mpr/keyword/export-excel', params);
}

/** 获取关键词精简信息列表 */
export function getSimpleKeywordList(assistantId: number) {
  return requestClient.get<KeywordApi.Keyword[]>('/mpr/keyword/simple-list', {
    params: {
      assistantId,
    },
  });
}
