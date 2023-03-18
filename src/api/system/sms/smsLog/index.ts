import { defHttp } from '@/utils/http/axios'

export interface SmsLogVO {
  id: number
  channelId: number
  channelCode: string
  templateId: number
  templateCode: string
  templateType: number
  templateContent: string
  templateParams: Map<string, object>
  mobile: string
  userId: number
  userType: number
  sendStatus: number
  sendTime: Date
  sendCode: number
  sendMsg: string
  apiSendCode: string
  apiSendMsg: string
  apidefHttpId: string
  apiSerialNo: string
  receiveStatus: number
  receiveTime: Date
  apiReceiveCode: string
  apiReceiveMsg: string
  createTime: Date
}

export interface SmsLogPageReqVO extends PageParam {
  channelId?: number
  templateId?: number
  mobile?: string
  sendStatus?: number
  sendTime?: Date[]
  receiveStatus?: number
  receiveTime?: Date[]
}
export interface SmsLogExportReqVO {
  channelId?: number
  templateId?: number
  mobile?: string
  sendStatus?: number
  sendTime?: Date[]
  receiveStatus?: number
  receiveTime?: Date[]
}

// 查询短信日志列表
export const getSmsLogPageApi = (params: SmsLogPageReqVO) => {
  return defHttp.get({ url: '/system/sms-log/page', params })
}

// 导出短信日志
export const exportSmsLogApi = (params: SmsLogExportReqVO) => {
  return defHttp.download({ url: '/system/sms-log/export', params })
}
