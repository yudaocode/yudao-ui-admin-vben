import { defHttp } from '@/utils/http/axios'

export interface SignInRecordVO {
  id: number
  userId: number
  day: number
  point: number
}

// 查询用户签到积分列表
export function getSignInRecordPage(params) {
  return defHttp.get({ url: '/member/point/sign-in-record/page', params })
}
