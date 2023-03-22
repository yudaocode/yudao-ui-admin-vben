import { defHttp } from '@/utils/http/axios'

// 获得邮件日志
export const getMailLogApi = (id: number) => {
  return defHttp.get({ url: '/system/mail-log/get?id=' + id })
}

// 获得邮件日志分页
export const getMailAccountPageApi = (params) => {
  return defHttp.get({ url: '/system/mail-log/page', params })
}
