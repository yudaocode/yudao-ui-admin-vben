import { defHttp } from '@/utils/http/axios'
import qs from 'qs'

// 获得站内信分页
export const getPostPageApi = (params) => {
  return defHttp.get({ url: '/system/notify-message/page', params })
}

// 获得我的站内信分页
export const listSimplePostsApi = (params) => {
  return defHttp.get({ url: '/system/notify-message/my-page', params })
}

// 批量标记已读
export const updateNotifyMessageReadApi = (ids: number[]) => {
  return defHttp.put({ url: '/system/notify-message/update-read?' + qs.stringify({ ids: ids }, { indices: false }) })
}

// 标记所有站内信为已读
export const updateAllNotifyMessageReadApi = () => {
  return defHttp.put({ url: '/system/notify-message/update-all-read' })
}

// 获取当前用户的最新站内信列表
export const getUnreadNotifyMessageListApi = () => {
  return defHttp.get({ url: '/system/notify-message/get-unread-list' })
}

// 获得当前用户的未读站内信数量
export const getUnreadNotifyMessageCountApi = () => {
  return defHttp.get({ url: '/system/notify-message/get-unread-count' })
}
