import { defHttp } from '@/utils/http/axios'

// 创建邮箱账号
export const createMailAccountApi = (data) => {
  return defHttp.post({ url: '/system/mail-account/create', data })
}

// 更新邮箱账号
export const updateMailAccountApi = (data) => {
  return defHttp.put({ url: '/system/mail-account/update', data })
}

// 删除邮箱账号
export const deleteMailAccountApi = (id: number) => {
  return defHttp.delete({ url: '/system/mail-account/delete?id=' + id })
}

// 获得邮箱账号
export const getMailAccountApi = (id: number) => {
  return defHttp.get({ url: '/system/mail-account/get?id=' + id })
}

// 获得邮箱账号分页
export const getMailAccountPageApi = (params) => {
  return defHttp.get({ url: '/system/mail-account/page', params })
}

// 获取邮箱账号的精简信息列表
export const getSimpleMailAccountListApi = () => {
  return defHttp.get({ url: '/system/mail-account/list-all-simple' })
}
