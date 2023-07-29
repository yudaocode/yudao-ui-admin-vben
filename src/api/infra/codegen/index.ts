import type { CodegenCreateListReqVO, CodegenUpdateReqVO } from './types'
import { defHttp } from '@/utils/http/axios'

// 查询列表代码生成表定义
export function getCodegenTablePage(params) {
  return defHttp.get({ url: '/infra/codegen/table/page', params })
}

// 查询详情代码生成表定义
export function getCodegenTable(id: number) {
  return defHttp.get({ url: `/infra/codegen/detail?tableId=${id}` })
}

// 新增代码生成表定义
export function createCodegenTable(data: CodegenCreateListReqVO) {
  return defHttp.post({ url: '/infra/codegen/create', data })
}

// 修改代码生成表定义
export function updateCodegenTable(data: CodegenUpdateReqVO) {
  return defHttp.put({ url: '/infra/codegen/update', data })
}

// 基于数据库的表结构，同步数据库的表和字段定义
export function syncCodegenFromDB(id: number) {
  return defHttp.put({ url: `/infra/codegen/sync-from-db?tableId=${id}` })
}

// 基于 SQL 建表语句，同步数据库的表和字段定义
export function syncCodegenFromSQL(id: number, sql: string) {
  return defHttp.put({ url: `/infra/codegen/sync-from-sql?tableId=${id}&sql=${sql}` })
}

// 预览生成代码
export function previewCodegen(id: number) {
  return defHttp.get({ url: `/infra/codegen/preview?tableId=${id}` })
}

// 下载生成代码
export function downloadCodegen(data) {
  return defHttp.download({ url: `/infra/codegen/download?tableId=${data.id}` }, `${data.tableName}.zip`)
}

// 获得表定义
export function getSchemaTableList(params) {
  return defHttp.get({ url: '/infra/codegen/db/table/list', params })
}

// 基于数据库的表结构，创建代码生成器的表定义
export function createCodegenList(data) {
  return defHttp.post({ url: '/infra/codegen/create-list', data })
}

// 删除代码生成表定义
export function deleteCodegenTable(id: number) {
  return defHttp.delete({ url: `/infra/codegen/delete?tableId=${id}` })
}
