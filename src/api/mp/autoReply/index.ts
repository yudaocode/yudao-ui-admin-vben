import { defHttp } from '@/utils/http/axios'

// 创建公众号的自动回复
export function createAutoReply(data) {
  return defHttp.post({ url: '/mp/auto-reply/create', data })
}

// 更新公众号的自动回复
export function updateAutoReply(data) {
  return defHttp.put({ url: '/mp/auto-reply/update', data })
}

// 删除公众号的自动回复
export function deleteAutoReply(id) {
  return defHttp.delete({ url: `/mp/auto-reply/delete?id=${id}` })
}

// 获得公众号的自动回复
export function getAutoReply(id) {
  return defHttp.get({ url: `/mp/auto-reply/get?id=${id}` })
}

// 获得公众号的自动回复分页
export function getAutoReplyPage(params) {
  return defHttp.get({ url: '/mp/auto-reply/page', params })
}
