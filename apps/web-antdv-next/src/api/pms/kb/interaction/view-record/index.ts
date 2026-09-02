import type { PmsKnowledgeInteractionApi } from '../types';

import { requestClient } from '#/api/request';

export namespace PmsKnowledgeViewRecordApi {
  /** PMS 知识最近浏览 */
  export interface KnowledgeRecentList {
    todayItems: PmsKnowledgeInteractionApi.KnowledgeInteractionItem[]; // 今天浏览列表
    yesterdayItems: PmsKnowledgeInteractionApi.KnowledgeInteractionItem[]; // 昨天浏览列表
    recent30DayItems: PmsKnowledgeInteractionApi.KnowledgeInteractionItem[]; // 更早 30 天浏览列表
  }
}

/** 查询最近浏览列表 */
export function getKnowledgeRecentViewRecordList(libraryId?: number) {
  return requestClient.get<PmsKnowledgeViewRecordApi.KnowledgeRecentList>(
    '/pms/kb/view-record/recent-list',
    { params: { libraryId } },
  );
}

export type { PmsKnowledgeInteractionApi } from '../types';
