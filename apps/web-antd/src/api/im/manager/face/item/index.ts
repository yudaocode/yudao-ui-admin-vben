import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerFacePackItemApi {
  /** 表情项 */
  export interface FacePackItem {
    id: number;
    packId: number;
    url: string;
    name?: string;
    width: number;
    height: number;
    sort: number;
    status: number;
    createTime?: Date;
  }
}

/** 获得表情分页 */
export function getManagerFacePackItemPage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerFacePackItemApi.FacePackItem>>(
    '/im/manager/face-pack-item/page',
    { params },
  );
}

/** 获得表情详情 */
export function getManagerFacePackItem(id: number) {
  return requestClient.get<ImManagerFacePackItemApi.FacePackItem>(
    '/im/manager/face-pack-item/get',
    { params: { id } },
  );
}

/** 新增表情 */
export function createManagerFacePackItem(
  data: ImManagerFacePackItemApi.FacePackItem,
) {
  return requestClient.post<number>('/im/manager/face-pack-item/create', data);
}

/** 修改表情 */
export function updateManagerFacePackItem(
  data: ImManagerFacePackItemApi.FacePackItem,
) {
  return requestClient.put<boolean>('/im/manager/face-pack-item/update', data);
}

/** 删除表情 */
export function deleteManagerFacePackItem(id: number) {
  return requestClient.delete<boolean>('/im/manager/face-pack-item/delete', {
    params: { id },
  });
}

/** 批量删除表情 */
export function deleteManagerFacePackItemList(ids: number[]) {
  return requestClient.delete<boolean>(
    '/im/manager/face-pack-item/delete-list',
    { params: { ids: ids.join(',') } },
  );
}
