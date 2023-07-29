import { defHttp } from '@/utils/http/axios'

// 更新公众号粉丝
export function updateUser(data) {
  return defHttp.put({ url: '/mp/user/update', data })
}

// 获得公众号粉丝
export function getUser(id) {
  return defHttp.get({ url: `/mp/user/get?id=${id}` })
}

// 获得公众号粉丝分页
export function getUserPage(params) {
  return defHttp.get({ url: '/mp/user/page', params })
}

// 同步公众号粉丝
export function syncUser(accountId) {
  return defHttp.post({ url: `/mp/user/sync?accountId=${accountId}` })
}
