import { defHttp } from '@/utils/http/axios'

// 创建公众号账号
export const createAccount = async (data) => {
  return await defHttp.post({ url: '/mp/account/create', data })
}

// 更新公众号账号
export const updateAccount = async (data) => {
  return defHttp.put({ url: '/mp/account/update', data })
}

// 删除公众号账号
export const deleteAccount = async (id) => {
  return defHttp.delete({ url: '/mp/account/delete?id=' + id, method: 'delete' })
}

// 获得公众号账号
export const getAccount = async (id) => {
  return defHttp.get({ url: '/mp/account/get?id=' + id })
}

// 获得公众号账号分页
export const getAccountPage = async (params) => {
  return defHttp.get({ url: '/mp/account/page', params })
}

// 获取公众号账号精简信息列表
export const getSimpleAccounts = async () => {
  return defHttp.get({ url: '/mp/account/list-all-simple' })
}

// 生成公众号二维码
export const generateAccountQrCode = async (id) => {
  return defHttp.put({ url: '/mp/account/generate-qr-code?id=' + id })
}

// 清空公众号 API 配额
export const clearAccountQuota = async (id) => {
  return defHttp.put({ url: '/mp/account/clear-quota?id=' + id })
}
