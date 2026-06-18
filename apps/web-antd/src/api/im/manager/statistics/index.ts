import { requestClient } from '#/api/request'

export interface ImStatisticsOverviewVO {
  totalUser: number
  newUserToday: number
  totalGroup: number
  newGroupToday: number
  activeUserDaily: number
  activeUserWeekly: number
  activeUserMonthly: number
  privateMessageToday: number
  groupMessageToday: number
  privateMessageYesterday: number
  groupMessageYesterday: number
}

export interface ImStatisticsTrendVO {
  dates: string[]
  series: Record<string, number[]>
}

export interface ImStatisticsMessageTypeVO {
  type: number
  value: number
}

export interface ImStatisticsGroupSizeVO {
  range: string
  count: number
}

export interface ImStatisticsTopSenderVO {
  userId: number
  nickname: string
  messageCount: number
}

// 获得 KPI 概览
export const getStatisticsOverview = (): Promise<ImStatisticsOverviewVO> => {
  return requestClient.get('/im/manager/statistics/overview')
}

// 获得消息趋势
export const getMessageTrend = (days: number): Promise<ImStatisticsTrendVO> => {
  return requestClient.get('/im/manager/statistics/message-trend', { params: { days } })
}

// 获得用户趋势
export const getUserTrend = (days: number): Promise<ImStatisticsTrendVO> => {
  return requestClient.get('/im/manager/statistics/user-trend', { params: { days } })
}

// 获得内容类型分布
export const getMessageTypeDistribution = (): Promise<ImStatisticsMessageTypeVO[]> => {
  return requestClient.get('/im/manager/statistics/message-type-distribution')
}

// 获得群规模分布
export const getGroupSizeDistribution = (): Promise<ImStatisticsGroupSizeVO[]> => {
  return requestClient.get('/im/manager/statistics/group-size-distribution')
}

// 获得消息 TOP 发送者
export const getTopSenders = (): Promise<ImStatisticsTopSenderVO[]> => {
  return requestClient.get('/im/manager/statistics/top-senders')
}
