import type { PageParam } from '@vben/request'

import { requestClient } from '#/api/request'

export interface ImManagerFaceUserItemVO {
  id: number
  userId: number
  userNickname?: string
  url: string
  name?: string
  width?: number
  height?: number
  createTime?: Date
}

// 获得用户表情分页
export const getManagerFaceUserItemPage = (params: PageParam) => {
  return requestClient.get('/im/manager/face-user-item/page', { params })
}

// 删除用户表情
export const deleteManagerFaceUserItem = (id: number) => {
  return requestClient.delete('/im/manager/face-user-item/delete', { params: { id } })
}
