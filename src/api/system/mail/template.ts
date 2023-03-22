import { defHttp } from '@/utils/http/axios'

// 创建邮件模版
export const createMailTemplateApi = (data) => {
  return defHttp.post({ url: '/system/mail-template/create', data })
}

// 更新邮件模版
export const updateMailTemplateApi = (data) => {
  return defHttp.put({ url: '/system/mail-template/update', data })
}

// 删除邮件模版
export const deleteMailTemplateApi = (id: number) => {
  return defHttp.delete({ url: '/system/mail-template/delete?id=' + id })
}

// 获得邮件模版
export const getMailTemplateApi = (id: number) => {
  return defHttp.get({ url: '/system/mail-template/get?id=' + id })
}

// 获得邮件模版分页
export const getMailTemplatePageApi = (params) => {
  return defHttp.get({ url: '/system/mail-template/page', params })
}

// 发送测试邮件
export const sendMail = (data) => {
  return defHttp.post({ url: '/system/mail-template/send-mail', data })
}
