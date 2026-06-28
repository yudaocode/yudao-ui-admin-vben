import { requestClient } from '#/api/request';

export namespace ImFaceUserItemApi {
  /** 个人表情 */
  export interface FaceUserItem {
    id: number;
    url: string;
    name?: string;
    width: number;
    height: number;
  }

  /** 添加个人表情请求 */
  export interface FaceUserItemSaveReqVO {
    url: string;
    name?: string;
    width: number;
    height: number;
  }
}

/** 获取我的个人表情列表 */
export function getFaceUserItemList() {
  return requestClient.get<ImFaceUserItemApi.FaceUserItem[]>(
    '/im/face-user-item/list',
  );
}

/** 添加个人表情 */
export function createFaceUserItem(
  data: ImFaceUserItemApi.FaceUserItemSaveReqVO,
) {
  return requestClient.post<number>('/im/face-user-item/create', data);
}

/** 删除个人表情 */
export function deleteFaceUserItem(id: number) {
  return requestClient.delete<boolean>('/im/face-user-item/delete', {
    params: { id },
  });
}
