import { defHttp } from '@/utils/http/axios'

// 创建邮件模版
export function createMailTemplate(data) {
  return defHttp.post({ url: '/system/mail-template/create', data })
}

// 更新邮件模版
export function updateMailTemplate(data) {
  return defHttp.put({ url: '/system/mail-template/update', data })
}

// 删除邮件模版
export function deleteMailTemplate(id: number) {
  return defHttp.delete({ url: `/system/mail-template/delete?id=${id}` })
}

// 获得邮件模版
export function getMailTemplate(id: number) {
  return defHttp.get({ url: `/system/mail-template/get?id=${id}` })
}

// 获得邮件模版分页
export function getMailTemplatePage(params) {
  return defHttp.get({ url: '/system/mail-template/page', params })
}

// 邮件模板
export interface MailTemplate {
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

export interface SendMailParams {
  mail: string
  templateCode: string
  templateParams: {
    [key: string]: any
  }
}

// 发送测试邮件
export function sendMail(data: SendMailParams) {
  return defHttp.post({ url: '/system/mail-template/send-mail', data })
}
