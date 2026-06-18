import type { PageParam } from '@vben/request'

import { requestClient } from '#/api/request'

export interface ImManagerChannelMaterialVO {
  id: number
  channelId: number
  channelName?: string
  type: number
  title: string
  coverUrl?: string
  summary?: string
  content?: string
  url?: string
  createTime?: Date
}

// 获得素材分页
export const getManagerChannelMaterialPage = (params: PageParam) => {
  return requestClient.get('/im/manager/channel-material/page', { params })
}

// 获得指定频道下的素材精简列表
export const getSimpleManagerChannelMaterialList = (channelId: number) => {
  return requestClient.get('/im/manager/channel-material/simple-list', { params: { channelId } })
}

// 获得素材详情
export const getManagerChannelMaterial = (id: number) => {
  return requestClient.get('/im/manager/channel-material/get', { params: { id } })
}

// 新增素材
export const createManagerChannelMaterial = (data: ImManagerChannelMaterialVO) => {
  return requestClient.post('/im/manager/channel-material/create', data)
}

// 修改素材
export const updateManagerChannelMaterial = (data: ImManagerChannelMaterialVO) => {
  return requestClient.put('/im/manager/channel-material/update', data)
}

// 删除素材
export const deleteManagerChannelMaterial = (id: number) => {
  return requestClient.delete('/im/manager/channel-material/delete', { params: { id } })
}
