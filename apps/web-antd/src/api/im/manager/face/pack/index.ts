import type { PageParam } from '@vben/request'

import { requestClient } from '#/api/request'

export interface ImManagerFacePackVO {
  id: number
  name: string
  icon?: string
  sort: number
  status: number
  createTime?: Date
}

// 获得表情包分页
export const getManagerFacePackPage = (params: PageParam) => {
  return requestClient.get('/im/manager/face-pack/page', { params })
}

// 获得表情包详情
export const getManagerFacePack = (id: number) => {
  return requestClient.get('/im/manager/face-pack/get', { params: { id } })
}

// 新增表情包
export const createManagerFacePack = (data: ImManagerFacePackVO) => {
  return requestClient.post('/im/manager/face-pack/create', data)
}

// 修改表情包
export const updateManagerFacePack = (data: ImManagerFacePackVO) => {
  return requestClient.put('/im/manager/face-pack/update', data)
}

// 删除表情包
export const deleteManagerFacePack = (id: number) => {
  return requestClient.delete('/im/manager/face-pack/delete', { params: { id } })
}

// 批量删除表情包
export const deleteManagerFacePackList = (ids: number[]) => {
  return requestClient.delete('/im/manager/face-pack/delete-list', {
    params: { ids: ids.join(',') }
  })
}
