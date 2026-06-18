import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerFacePackApi {
  /** 表情包 */
  export interface FacePack {
    id: number;
    name: string;
    icon?: string;
    sort: number;
    status: number;
    createTime?: Date;
  }
}


/** 获得表情包分页 */
export function getManagerFacePackPage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerFacePackApi.FacePack>>(
    '/im/manager/face-pack/page',
    { params },
  );
}

/** 获得表情包详情 */
export function getManagerFacePack(id: number) {
  return requestClient.get<ImManagerFacePackApi.FacePack>('/im/manager/face-pack/get', {
    params: { id },
  });
}

/** 新增表情包 */
export function createManagerFacePack(data: ImManagerFacePackApi.FacePack) {
  return requestClient.post<number>('/im/manager/face-pack/create', data);
}

/** 修改表情包 */
export function updateManagerFacePack(data: ImManagerFacePackApi.FacePack) {
  return requestClient.put<boolean>('/im/manager/face-pack/update', data);
}

/** 删除表情包 */
export function deleteManagerFacePack(id: number) {
  return requestClient.delete<boolean>('/im/manager/face-pack/delete', {
    params: { id },
  });
}

/** 批量删除表情包 */
export function deleteManagerFacePackList(ids: number[]) {
  return requestClient.delete<boolean>('/im/manager/face-pack/delete-list', {
    params: { ids: ids.join(',') },
  });
}
