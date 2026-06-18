// TODO @AI：api 的风格，要和 vben 保持一致；
import { requestClient } from '#/api/request'

// 用户端能看到的频道素材详情
export interface ImChannelMaterialRespVO {
  id: number
  channelId: number
  type: number
  title: string
  coverUrl?: string
  summary?: string
  content?: string
  url?: string
}

// 获取频道素材详情；用于客户端点击图文卡片渲染详情页
export const getChannelMaterial = (id: number) => {
  return requestClient.get<ImChannelMaterialRespVO>('/im/channel/material/get', { params: { id } })
}
