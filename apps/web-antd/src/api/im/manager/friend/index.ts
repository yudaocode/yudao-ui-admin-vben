import type { PageParam } from '@vben/request'

import { requestClient } from '#/api/request'

export interface ImManagerFriendVO {
  id: number
  userId: number
  userNickname?: string
  friendUserId: number
  friendNickname?: string
  displayName?: string
  addSource?: number
  silent: boolean
  pinned: boolean
  blocked: boolean
  status: number
  addTime?: Date
  deleteTime?: Date
  createTime: Date
}

// 获得好友关系分页
export const getManagerFriendPage = (params: PageParam) => {
  return requestClient.get('/im/manager/friend/page', { params })
}
