import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerFaceUserItemApi {
  /** 用户表情 */
  export interface FaceUserItem {
    id: number;
    userId: number;
    userNickname?: string;
    url: string;
    name?: string;
    width?: number;
    height?: number;
    createTime?: Date;
  }
}


/** 获得用户表情分页 */
export function getManagerFaceUserItemPage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerFaceUserItemApi.FaceUserItem>>(
    '/im/manager/face-user-item/page',
    { params },
  );
}

/** 删除用户表情 */
export function deleteManagerFaceUserItem(id: number) {
  return requestClient.delete<boolean>('/im/manager/face-user-item/delete', {
    params: { id },
  });
}
