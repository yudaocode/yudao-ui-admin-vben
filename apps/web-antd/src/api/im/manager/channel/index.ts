import type { PageParam } from '@vben/request'

import { requestClient } from '#/api/request'

export interface ImManagerChannelVO {
  id: number
  code: string
  name: string
  avatar?: string
  sort: number
  status: number
  createTime?: Date
}

// 获得频道分页
export const getManagerChannelPage = (params: PageParam) => {
  return requestClient.get('/im/manager/channel/page', { params })
}

// 获得频道详情
export const getManagerChannel = (id: number) => {
  return requestClient.get('/im/manager/channel/get', { params: { id } })
}

// 新增频道
export const createManagerChannel = (data: ImManagerChannelVO) => {
  return requestClient.post('/im/manager/channel/create', data)
}

// 修改频道
export const updateManagerChannel = (data: ImManagerChannelVO) => {
  return requestClient.put('/im/manager/channel/update', data)
}

// 删除频道
export const deleteManagerChannel = (id: number) => {
  return requestClient.delete('/im/manager/channel/delete', { params: { id } })
}

// 获得启用的频道精简列表（表单选择用）
export const getSimpleChannelList = () => {
  return requestClient.get<ImManagerChannelVO[]>('/im/manager/channel/simple-list')
}
