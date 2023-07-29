import type { DictTypeExportReqVO, DictTypePageReqVO, DictTypeVO } from './types'
import { defHttp } from '@/utils/http/axios'

// 查询字典（精简)列表
export function listSimpleDictType() {
  return defHttp.get({ url: '/system/dict-type/list-all-simple' })
}

// 查询字典列表
export function getDictTypePage(params: DictTypePageReqVO) {
  return defHttp.get({ url: '/system/dict-type/page', params })
}

// 查询字典详情
export function getDictType(id: number) {
  return defHttp.get({ url: `/system/dict-type/get?id=${id}` })
}

// 新增字典
export function createDictType(data: DictTypeVO) {
  return defHttp.post({ url: '/system/dict-type/create', data })
}

// 修改字典
export function updateDictType(data: DictTypeVO) {
  return defHttp.put({ url: '/system/dict-type/update', data })
}

// 删除字典
export function deleteDictType(id: number) {
  return defHttp.delete({ url: `/system/dict-type/delete?id=${id}` })
}
// 导出字典类型
export function exportDictType(params: DictTypeExportReqVO) {
  return defHttp.get({ url: '/system/dict-type/export', params })
}
