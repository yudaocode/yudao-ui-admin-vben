import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerSensitiveWordApi {
  /** 敏感词 */
  export interface SensitiveWord {
    id: number;
    word: string;
    status: number;
    creator?: string;
    creatorName?: string;
    createTime?: Date;
  }
}


/** 获得敏感词分页 */
export function getManagerSensitiveWordPage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerSensitiveWordApi.SensitiveWord>>(
    '/im/manager/sensitive-word/page',
    { params },
  );
}

/** 获得敏感词详情 */
export function getManagerSensitiveWord(id: number) {
  return requestClient.get<ImManagerSensitiveWordApi.SensitiveWord>(
    '/im/manager/sensitive-word/get',
    { params: { id } },
  );
}

/** 新增敏感词 */
export function createManagerSensitiveWord(data: ImManagerSensitiveWordApi.SensitiveWord) {
  return requestClient.post<number>('/im/manager/sensitive-word/create', data);
}

/** 修改敏感词 */
export function updateManagerSensitiveWord(data: ImManagerSensitiveWordApi.SensitiveWord) {
  return requestClient.put<boolean>(
    '/im/manager/sensitive-word/update',
    data,
  );
}

/** 删除敏感词 */
export function deleteManagerSensitiveWord(id: number) {
  return requestClient.delete<boolean>('/im/manager/sensitive-word/delete', {
    params: { id },
  });
}

/** 批量删除敏感词 */
export function deleteManagerSensitiveWordList(ids: number[]) {
  return requestClient.delete<boolean>(
    '/im/manager/sensitive-word/delete-list',
    { params: { ids: ids.join(',') } },
  );
}
