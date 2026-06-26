import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerChannelMaterialApi {
  /** 频道素材 */
  export interface Material {
    id: number;
    channelId: number;
    channelName?: string;
    type: number;
    title: string;
    coverUrl?: string;
    summary?: string;
    content?: string;
    url?: string;
    createTime?: Date;
  }
}

/** 获得素材分页 */
export function getManagerChannelMaterialPage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerChannelMaterialApi.Material>>(
    '/im/manager/channel-material/page',
    { params },
  );
}

/** 获得指定频道下的素材精简列表 */
export function getSimpleManagerChannelMaterialList(channelId: number) {
  return requestClient.get<ImManagerChannelMaterialApi.Material[]>(
    '/im/manager/channel-material/simple-list',
    { params: { channelId } },
  );
}

/** 获得素材详情 */
export function getManagerChannelMaterial(id: number) {
  return requestClient.get<ImManagerChannelMaterialApi.Material>(
    '/im/manager/channel-material/get',
    { params: { id } },
  );
}

/** 新增素材 */
export function createManagerChannelMaterial(
  data: ImManagerChannelMaterialApi.Material,
) {
  return requestClient.post<number>(
    '/im/manager/channel-material/create',
    data,
  );
}

/** 修改素材 */
export function updateManagerChannelMaterial(
  data: ImManagerChannelMaterialApi.Material,
) {
  return requestClient.put<boolean>(
    '/im/manager/channel-material/update',
    data,
  );
}

/** 删除素材 */
export function deleteManagerChannelMaterial(id: number) {
  return requestClient.delete<boolean>('/im/manager/channel-material/delete', {
    params: { id },
  });
}
