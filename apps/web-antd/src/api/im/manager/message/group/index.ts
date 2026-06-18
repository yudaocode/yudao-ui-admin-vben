import type { PageParam } from '@vben/request'

import { requestClient } from '#/api/request'

export interface ImManagerGroupMessageVO {
  id: number
  clientMessageId?: string
  groupId: number
  groupName?: string
  senderId: number
  senderNickname?: string
  type: number
  content: string
  status: number
  atUserIds?: number[]
  atUserNicknames?: (null | string)[]
  receiptStatus: number
  sendTime: Date
  createTime: Date
}

// 获得群聊消息分页
export const getManagerGroupMessagePage = (params: PageParam) => {
  return requestClient.get('/im/manager/message/group/page', { params })
}

// 获得群聊消息详情
export const getManagerGroupMessage = (id: number) => {
  return requestClient.get('/im/manager/message/group/get', { params: { id } })
}
