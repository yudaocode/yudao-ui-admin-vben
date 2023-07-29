import { defHttp } from '@/utils/http/axios'

export interface SmsChannelVO {
  id: number
  code: string
  status: number
  signature: string
  remark: string
  apiKey: string
  apiSecret: string
  callbackUrl: string
  createTime: Date
}

export interface SmsChannelPageReqVO extends PageParam {
  signature?: string
  code?: string
  status?: number
  createTime?: Date[]
}

// 查询短信渠道列表
export function getSmsChannelPage(params: SmsChannelPageReqVO) {
  return defHttp.get({ url: '/system/sms-channel/page', params })
}

// 获得短信渠道精简列表
export function getSimpleSmsChannels() {
  return defHttp.get({ url: '/system/sms-channel/list-all-simple' })
}

// 查询短信渠道详情
export function getSmsChannel(id: number) {
  return defHttp.get({ url: `/system/sms-channel/get?id=${id}` })
}

// 新增短信渠道
export function createSmsChannel(data: SmsChannelVO) {
  return defHttp.post({ url: '/system/sms-channel/create', data })
}

// 修改短信渠道
export function updateSmsChannel(data: SmsChannelVO) {
  return defHttp.put({ url: '/system/sms-channel/update', data })
}

// 删除短信渠道
export function deleteSmsChannel(id: number) {
  return defHttp.delete({ url: `/system/sms-channel/delete?id=${id}` })
}
