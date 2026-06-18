import type { PageParam } from '@vben/request'

import { requestClient } from '#/api/request'

export interface ImManagerFriendRequestVO {
  id: number
  fromUserId: number
  fromNickname?: string
  toUserId: number
  toNickname?: string
  applyContent?: string
  displayName?: string
  addSource?: number
  handleResult: number
  handleContent?: string
  handleTime?: Date
  createTime: Date
}

// 获得好友申请分页
export const getManagerFriendRequestPage = (params: PageParam) => {
  return requestClient.get('/im/manager/friend-request/page', { params })
}
