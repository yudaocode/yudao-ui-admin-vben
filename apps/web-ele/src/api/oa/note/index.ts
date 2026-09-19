import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaNoteApi {
  /** OA 笔记 */
  export interface Note {
    id?: number; // 笔记编号
    creatorUserId?: number; // 创建人用户编号
    creatorUserName?: string; // 创建人用户昵称
    categoryId?: number; // 目录编号
    categoryName?: string; // 目录名称
    type: number; // 笔记类型
    priority: number; // 优先级
    title: string; // 标题
    content?: string; // 内容
    favorite?: boolean; // 是否收藏
    fileUrls: string[]; // 附件地址列表
    receiverUserIds?: number[]; // 接收人用户编号列表
    receiverUserNames?: string[]; // 接收人用户昵称列表
    createTime?: string; // 创建时间
  }
}

/** 查询我的笔记分页 */
export function getMyNotePage(params: PageParam) {
  return requestClient.get<PageResult<OaNoteApi.Note>>('/oa/note/my-page', {
    params,
  });
}

/** 查询共享给我的笔记分页 */
export function getReceivedNotePage(params: PageParam) {
  return requestClient.get<PageResult<OaNoteApi.Note>>(
    '/oa/note/received-page',
    { params },
  );
}

/** 查询笔记详情 */
export function getNote(id: number) {
  return requestClient.get<OaNoteApi.Note>('/oa/note/get', { params: { id } });
}

/** 新增笔记 */
export function createNote(data: Partial<OaNoteApi.Note>) {
  return requestClient.post<number>('/oa/note/create', data);
}

/** 修改笔记 */
export function updateNote(data: Partial<OaNoteApi.Note>) {
  return requestClient.put<boolean>('/oa/note/update', data);
}

/** 删除笔记 */
export function deleteNote(id: number) {
  return requestClient.delete<boolean>('/oa/note/delete', { params: { id } });
}

/** 移除收到的共享笔记，仅删除本人的接收关系 */
export function deleteReceivedNote(id: number) {
  return requestClient.delete<boolean>('/oa/note/delete-received', {
    params: { id },
  });
}

/** 修改笔记收藏状态 */
export function updateNoteFavorite(id: number, favorite: boolean) {
  return requestClient.put<boolean>('/oa/note/update-favorite', {
    id,
    favorite,
  });
}

/** 修改笔记共享接收人 */
export function updateNoteShare(id: number, receiverUserIds: number[]) {
  return requestClient.put<boolean>('/oa/note/update-share', {
    id,
    receiverUserIds,
  });
}
