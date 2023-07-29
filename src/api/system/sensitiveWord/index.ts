import { defHttp } from '@/utils/http/axios'

export interface SensitiveWordVO {
  id: number
  name: string
  status: number
  description: string
  tags: string[]
  createTime: Date
}

export interface SensitiveWordPageReqVO extends PageParam {
  name?: string
  tag?: string
  status?: number
  createTime?: Date[]
}

export interface SensitiveWordExportReqVO {
  name?: string
  tag?: string
  status?: number
  createTime?: Date[]
}

// 查询敏感词列表
export function getSensitiveWordPage(params: SensitiveWordPageReqVO) {
  return defHttp.get({ url: '/system/sensitive-word/page', params })
}

// 查询敏感词详情
export function getSensitiveWord(id: number) {
  return defHttp.get({ url: `/system/sensitive-word/get?id=${id}` })
}

// 新增敏感词
export function createSensitiveWord(data: SensitiveWordVO) {
  return defHttp.post({ url: '/system/sensitive-word/create', data })
}

// 修改敏感词
export function updateSensitiveWord(data: SensitiveWordVO) {
  return defHttp.put({ url: '/system/sensitive-word/update', data })
}

// 删除敏感词
export function deleteSensitiveWord(id: number) {
  return defHttp.delete({ url: `/system/sensitive-word/delete?id=${id}` })
}

// 导出敏感词
export function exportSensitiveWord(params: SensitiveWordExportReqVO) {
  return defHttp.download({ url: '/system/sensitive-word/export-excel', params }, '导出敏感词.xls')
}

// 获取所有敏感词的标签数组
export function getSensitiveWordTags() {
  return defHttp.get({ url: '/system/sensitive-word/get-tags' })
}

// 获得文本所包含的不合法的敏感词数组
export function validateText(id: number) {
  return defHttp.get({ url: `/system/sensitive-word/validate-text?${id}` })
}
