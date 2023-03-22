import { defHttp } from '@/utils/http/axios'

export interface ConfigVO {
  id: number
  category: string
  name: string
  key: string
  value: string
  type: number
  visible: boolean
  remark: string
  createTime: Date
}

export interface ConfigPageReqVO extends PageParam {
  name?: string
  key?: string
  type?: number
  createTime?: Date[]
}

export interface ConfigExportReqVO {
  name?: string
  key?: string
  type?: number
  createTime?: Date[]
}

// 查询参数列表
export function getConfigPageApi(params: ConfigPageReqVO) {
  return defHttp.get({ url: '/infra/config/page', params })
}

// 查询参数详情
export function getConfigApi(id: number) {
  return defHttp.get({ url: '/infra/config/get?id=' + id })
}

// 根据参数键名查询参数值
export function getConfigKeyApi(configKey: string) {
  return defHttp.get({ url: '/infra/config/get-value-by-key?key=' + configKey })
}

// 新增参数
export function createConfigApi(data: ConfigVO) {
  return defHttp.post({ url: '/infra/config/create', data })
}

// 修改参数
export function updateConfigApi(data: ConfigVO) {
  return defHttp.put({ url: '/infra/config/update', data })
}

// 删除参数
export function deleteConfigApi(id: number) {
  return defHttp.delete({ url: '/infra/config/delete?id=' + id })
}

// 导出参数
export function exportConfigApi(params: ConfigExportReqVO) {
  return defHttp.download({ url: '/infra/config/export', params }, '参数.xls')
}
