import type { DictDataExportReqVO, DictDataPageReqVO, DictDataVO } from './types'
import { defHttp } from '@/utils/http/axios'

// 查询字典数据（精简)列表
export function listSimpleDictData() {
  return defHttp.get({ url: '/system/dict-data/list-all-simple' })
}

// 查询字典数据列表
export function getDictDataPage(params: DictDataPageReqVO) {
  return defHttp.get({ url: '/system/dict-data/page', params })
}

// 查询字典数据详情
export function getDictData(id: number) {
  return defHttp.get({ url: `/system/dict-data/get?id=${id}` })
}

// 新增字典数据
export function createDictData(data: DictDataVO) {
  return defHttp.post({ url: '/system/dict-data/create', data })
}

// 修改字典数据
export function updateDictData(data: DictDataVO) {
  return defHttp.put({ url: '/system/dict-data/update', data })
}

// 删除字典数据
export function deleteDictData(id: number) {
  return defHttp.delete({ url: `/system/dict-data/delete?id=${id}` })
}
// 导出字典类型数据
export function exportDictData(params: DictDataExportReqVO) {
  return defHttp.get({ url: '/system/dict-data/export', params })
}
