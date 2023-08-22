import { defHttp } from '@/utils/http/axios'

export interface RecordVO {
  id: number
  bizId: string
  bizType: string
  title: string
  description: string
  point: number
  totalPoint: number
  status: number
  userId: number
  freezingTime: Date
  thawingTime: Date
  createDate: Date
}

// 查询用户积分记录列表
export function getRecordPage(params) {
  return defHttp.get({ url: '/member/point/record/page', params })
}
