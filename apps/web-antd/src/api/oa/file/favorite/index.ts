import { requestClient } from '#/api/request';

/** 收藏文件 */
export function createFileFavorite(nodeId: number) {
  return requestClient.post<number>('/oa/file-favorite/create', null, {
    params: { nodeId },
  });
}

/** 取消收藏 */
export function deleteFileFavorite(nodeId: number) {
  return requestClient.delete<boolean>('/oa/file-favorite/delete', {
    params: { nodeId },
  });
}
