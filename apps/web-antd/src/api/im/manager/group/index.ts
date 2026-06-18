import type { PageParam } from '@vben/request'

import { requestClient } from '#/api/request'

export interface ImManagerGroupVO {
  id: number
  name: string
  avatar?: string
  notice?: string
  ownerUserId: number
  ownerNickname?: string
  memberCount?: number
  status: number
  banned: boolean
  mutedAll?: boolean
  bannedReason?: string
  bannedTime?: Date
  dissolvedTime?: Date
  createTime: Date
}

export interface ImManagerGroupMemberVO {
  userId: number
  nickname?: string
  avatar?: string
  displayUserName?: string
  groupRemark?: string
  silent?: boolean
  status: number
  role?: number
  joinTime?: Date
  quitTime?: Date
  muteEndTime?: Date
}

// 获得群分页
export const getManagerGroupPage = (params: PageParam) => {
  return requestClient.get('/im/manager/group/page', { params })
}

// 获得群详情
export const getManagerGroup = (id: number) => {
  return requestClient.get('/im/manager/group/get', { params: { id } })
}

// 封禁群
export const banManagerGroup = (data: { id: number; reason: string }) => {
  return requestClient.put('/im/manager/group/ban', data)
}

// 解封群
export const unbanManagerGroup = (id: number) => {
  return requestClient.put('/im/manager/group/unban', undefined, { params: { id } })
}

// 解散群
export const dissolveManagerGroup = (id: number) => {
  return requestClient.delete('/im/manager/group/dissolve', { params: { id } })
}

// 获得群成员列表
export const getManagerGroupMemberList = (groupId: number) => {
  return requestClient.get('/im/manager/group/member/list', { params: { groupId } })
}
