import qs from 'qs'
import { defHttp } from '@/utils/http/axios'

// 获得站内信分页
export function getNotifyMessagePage(params) {
  return defHttp.get({ url: '/system/notify-message/page', params })
}

// 获得我的站内信分页
export function getMyNotifyMessagePage(params) {
  return defHttp.get({ url: '/system/notify-message/my-page', params })
}

// 批量标记已读
export function updateNotifyMessageRead(ids: number[]) {
  return defHttp.put({ url: `/system/notify-message/update-read?${qs.stringify({ ids }, { indices: false })}` })
}

// 标记所有站内信为已读
export function updateAllNotifyMessageRead() {
  return defHttp.put({ url: '/system/notify-message/update-all-read' })
}

// 获取当前用户的最新站内信列表
export function getUnreadNotifyMessageList() {
  return defHttp.get({ url: '/system/notify-message/get-unread-list' })
}

// 获得当前用户的未读站内信数量
export function getUnreadNotifyMessageCount() {
  return defHttp.get<number>({ url: '/system/notify-message/get-unread-count' })
}
