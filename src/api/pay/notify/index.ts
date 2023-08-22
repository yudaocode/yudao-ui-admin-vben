import { defHttp } from '@/utils/http/axios'

// 获得支付通知明细
export function getNotifyTaskDetail(id) {
  return defHttp.get({ url: `/pay/notify/get-detail?id=${id}` })
}

// 获得支付通知分页
export function getNotifyTaskPage(params) {
  return defHttp.get({ url: '/pay/notify/page', params })
}
