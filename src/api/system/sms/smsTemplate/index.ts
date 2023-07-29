import { defHttp } from '@/utils/http/axios'

export interface SmsTemplateVO {
  id: number
  type: number
  status: number
  code: string
  name: string
  content: string
  remark: string
  apiTemplateId: string
  channelId: number
  channelCode: string
  params: string[]
  createTime: Date
}

export interface SendSmsReqVO {
  mobile: string
  templateCode: string
  templateParams: {
    [key: string]: any
  }
}

export interface SmsTemplatePageReqVO {
  type?: number
  status?: number
  code?: string
  content?: string
  apiTemplateId?: string
  channelId?: number
  createTime?: Date[]
}

export interface SmsTemplateExportReqVO {
  type?: number
  status?: number
  code?: string
  content?: string
  apiTemplateId?: string
  channelId?: number
  createTime?: Date[]
}

// 查询短信模板列表
export function getSmsTemplatePage(params: SmsTemplatePageReqVO) {
  return defHttp.get({ url: '/system/sms-template/page', params })
}

// 查询短信模板详情
export function getSmsTemplate(id: number) {
  return defHttp.get({ url: `/system/sms-template/get?id=${id}` })
}

// 新增短信模板
export function createSmsTemplate(data: SmsTemplateVO) {
  return defHttp.post({ url: '/system/sms-template/create', data })
}

// 修改短信模板
export function updateSmsTemplate(data: SmsTemplateVO) {
  return defHttp.put({ url: '/system/sms-template/update', data })
}

// 删除短信模板
export function deleteSmsTemplate(id: number) {
  return defHttp.delete({ url: `/system/sms-template/delete?id=${id}` })
}

// 邮件模板
export interface SmsTemplate {
  name: string // 标题
  code: string // 编码
  accountId: number
  nickname: string // 发送人
  title: string // 标题
  content: string // 内容
  status: number //
  remark?: any // 备注
  id: number
  params: string[] // 模板里的参数
  createTime: number
}

// 发送短信
export function sendSms(data: SendSmsReqVO) {
  return defHttp.post({ url: '/system/sms-template/send-sms', data })
}

// 导出短信模板
export function exportSmsTemplate(params: SmsTemplateExportReqVO) {
  return defHttp.download({ url: '/system/sms-template/export-excel', params }, '短信模板.xls')
}
