import { requestClient } from '#/api/request';

export namespace ImChannelMaterialApi {
  /** 用户端能看到的频道素材详情 */
  export interface Material {
    id: number;
    channelId: number;
    type: number;
    title: string;
    coverUrl?: string;
    summary?: string;
    content?: string;
    url?: string;
  }
}

/** 获取频道素材详情；用于客户端点击图文卡片渲染详情页 */
export function getChannelMaterial(id: number) {
  return requestClient.get<ImChannelMaterialApi.Material>(
    '/im/channel/material/get',
    { params: { id } },
  );
}
