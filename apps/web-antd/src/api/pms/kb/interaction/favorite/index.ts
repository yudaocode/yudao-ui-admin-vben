import type { PageParam, PageResult } from '@vben/request';

import type { PmsKnowledgeInteractionApi } from '../types';

import { requestClient } from '#/api/request';

/** 关注知识对象 */
export function createKnowledgeFavorite(data: { entityId: number; type: number }) {
  return requestClient.post<number>('/pms/kb/favorite/create', data);
}

/** 取消关注知识对象 */
export function deleteKnowledgeFavorite(type: number, entityId: number) {
  return requestClient.delete<boolean>('/pms/kb/favorite/delete', {
    params: { type, entityId },
  });
}

/** 查询关注列表分页 */
export function getKnowledgeFavoritePage(params: PageParam) {
  return requestClient.get<
    PageResult<PmsKnowledgeInteractionApi.KnowledgeInteractionItem>
  >('/pms/kb/favorite/page', { params });
}

/** 查询指定知识库内的关注内容 */
export function getKnowledgeFavoriteList(libraryId: number) {
  return requestClient.get<PmsKnowledgeInteractionApi.KnowledgeInteractionItem[]>(
    '/pms/kb/favorite/list',
    { params: { libraryId } },
  );
}

export type { PmsKnowledgeInteractionApi } from '../types';
