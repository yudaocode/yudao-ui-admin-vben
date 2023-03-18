import { defHttp } from '@/utils/http/axios'
import { LeaveVO } from './types'

// 创建请假申请
export const createLeaveApi = (data: LeaveVO) => {
  return defHttp.post({ url: '/bpm/oa/leave/create', data: data })
}

// 获得请假申请
export const getLeaveApi = (id: number) => {
  return defHttp.get({ url: '/bpm/oa/leave/get?id=' + id })
}

// 获得请假申请分页
export const getLeavePageApi = (params) => {
  return defHttp.get({ url: '/bpm/oa/leave/page', params })
}
