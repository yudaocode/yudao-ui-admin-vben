import { defHttp } from '@/utils/http/axios'

export interface LeaveVO {
  id: number
  result: number
  type: number
  reason: string
  processInstanceId: string
  startTime: string
  endTime: string
  createTime: string
}

// 创建请假申请
export function createLeave(data: LeaveVO) {
  return defHttp.post({ url: '/bpm/oa/leave/create', data })
}

// 获得请假申请
export function getLeave(id: number) {
  return defHttp.get({ url: `/bpm/oa/leave/get?id=${id}` })
}

// 获得请假申请分页
export function getLeavePage(params) {
  return defHttp.get({ url: '/bpm/oa/leave/page', params })
}
