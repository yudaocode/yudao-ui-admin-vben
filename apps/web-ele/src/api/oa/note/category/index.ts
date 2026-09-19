import { requestClient } from '#/api/request';

export namespace OaNoteCategoryApi {
  /** OA 笔记目录 */
  export interface NoteCategory {
    id?: number; // 目录编号
    name: string; // 目录名称
    sort: number; // 显示排序
    createTime?: string; // 创建时间
  }
}

/** 查询笔记目录列表 */
export function getNoteCategoryList() {
  return requestClient.get<OaNoteCategoryApi.NoteCategory[]>(
    '/oa/note-category/list',
  );
}

/** 查询笔记目录详情 */
export function getNoteCategory(id: number) {
  return requestClient.get<OaNoteCategoryApi.NoteCategory>(
    '/oa/note-category/get',
    { params: { id } },
  );
}

/** 查询笔记目录精简列表 */
export function getSimpleNoteCategoryList() {
  return requestClient.get<OaNoteCategoryApi.NoteCategory[]>(
    '/oa/note-category/simple-list',
  );
}

/** 新增笔记目录 */
export function createNoteCategory(data: Partial<OaNoteCategoryApi.NoteCategory>) {
  return requestClient.post<number>('/oa/note-category/create', data);
}

/** 修改笔记目录 */
export function updateNoteCategory(data: Partial<OaNoteCategoryApi.NoteCategory>) {
  return requestClient.put<boolean>('/oa/note-category/update', data);
}

/** 删除笔记目录 */
export function deleteNoteCategory(id: number) {
  return requestClient.delete<boolean>('/oa/note-category/delete', {
    params: { id },
  });
}
