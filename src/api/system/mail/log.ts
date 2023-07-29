import { defHttp } from '@/utils/http/axios'

// 获得邮件日志
export function getMailLog(id: number) {
  return defHttp.get({ url: `/system/mail-log/get?id=${id}` })
}

// 获得邮件日志分页
export function getMailAccountPage(params) {
  return defHttp.get({ url: '/system/mail-log/page', params })
}
