import { defHttp } from '@/utils/http/axios'

export interface AccountVO {
  id?: number
  name: string
}

// 创建公众号账号
export function createAccount(data) {
  return defHttp.post({ url: '/mp/account/create', data })
}

// 更新公众号账号
export function updateAccount(data) {
  return defHttp.put({ url: '/mp/account/update', data })
}

// 删除公众号账号
export function deleteAccount(id) {
  return defHttp.delete({ url: `/mp/account/delete?id=${id}`, method: 'delete' })
}

// 获得公众号账号
export function getAccount(id) {
  return defHttp.get({ url: `/mp/account/get?id=${id}` })
}

// 获得公众号账号分页
export function getAccountPage(params) {
  return defHttp.get({ url: '/mp/account/page', params })
}

// 获取公众号账号精简信息列表
export function getSimpleAccounts() {
  return defHttp.get({ url: '/mp/account/list-all-simple' })
}

// 生成公众号二维码
export function generateAccountQrCode(id) {
  return defHttp.put({ url: `/mp/account/generate-qr-code?id=${id}` })
}

// 清空公众号 API 配额
export function clearAccountQuota(id) {
  return defHttp.put({ url: `/mp/account/clear-quota?id=${id}` })
}
