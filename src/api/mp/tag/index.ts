import { defHttp } from '@/utils/http/axios'

// 创建公众号标签
export const createTag = (data) => {
  return defHttp.post({ url: '/mp/tag/create', data })
}

// 更新公众号标签
export const updateTag = (data) => {
  return defHttp.put({ url: '/mp/tag/update', data })
}

// 删除公众号标签
export const deleteTag = (id) => {
  return defHttp.delete({ url: '/mp/tag/delete?id=' + id })
}

// 获得公众号标签
export const getTag = (id) => {
  return defHttp.get({ url: '/mp/tag/get?id=' + id })
}

// 获得公众号标签分页
export const getTagPage = (params) => {
  return defHttp.get({ url: '/mp/tag/page', params })
}

// 获取公众号标签精简信息列表
export const getSimpleTags = () => {
  return defHttp.get({ url: '/mp/tag/list-all-simple' })
}

// 同步公众号标签
export const syncTag = (accountId) => {
  return defHttp.post({ url: '/mp/tag/sync?accountId=' + accountId })
}
