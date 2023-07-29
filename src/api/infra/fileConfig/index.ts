import { defHttp } from '@/utils/http/axios'

export interface FileClientConfig {
  basePath: string
  host?: string
  port?: number
  username?: string
  password?: string
  mode?: string
  endpoint?: string
  bucket?: string
  accessKey?: string
  accessSecret?: string
  domain: string
}
export interface FileConfigVO {
  id: number
  name: string
  storage: number
  master: boolean
  visible: boolean
  config: FileClientConfig
  remark: string
  createTime: Date
}

export interface FileConfigPageReqVO extends PageParam {
  name?: string
  storage?: number
  createTime?: Date[]
}

// 查询文件配置列表
export function getFileConfigPage(params: FileConfigPageReqVO) {
  return defHttp.get({ url: '/infra/file-config/page', params })
}

// 查询文件配置详情
export function getFileConfig(id: number) {
  return defHttp.get({ url: `/infra/file-config/get?id=${id}` })
}

// 更新文件配置为主配置
export function updateFileConfigMaster(id: number) {
  return defHttp.put({ url: `/infra/file-config/update-master?id=${id}` })
}

// 新增文件配置
export function createFileConfig(data: FileConfigVO) {
  return defHttp.post({ url: '/infra/file-config/create', data })
}

// 修改文件配置
export function updateFileConfig(data: FileConfigVO) {
  return defHttp.put({ url: '/infra/file-config/update', data })
}

// 删除文件配置
export function deleteFileConfig(id: number) {
  return defHttp.delete({ url: `/infra/file-config/delete?id=${id}` })
}

// 测试文件配置
export function testFileConfig(id: number) {
  return defHttp.get({ url: `/infra/file-config/test?id=${id}` })
}
