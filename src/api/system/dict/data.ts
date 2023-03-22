import { defHttp } from '@/utils/http/axios'
import type { DictDataVO, DictDataPageReqVO, DictDataExportReqVO } from './types'

// 查询字典数据（精简)列表
export const listSimpleDictData = () => {
  return defHttp.get({ url: '/system/dict-data/list-all-simple' })
}

// 查询字典数据列表
export const getDictDataPage = (params: DictDataPageReqVO) => {
  return defHttp.get({ url: '/system/dict-data/page', params })
}

// 查询字典数据详情
export const getDictData = (id: number) => {
  return defHttp.get({ url: '/system/dict-data/get?id=' + id })
}

// 新增字典数据
export const createDictData = (data: DictDataVO) => {
  return defHttp.post({ url: '/system/dict-data/create', data })
}

// 修改字典数据
export const updateDictData = (data: DictDataVO) => {
  return defHttp.put({ url: '/system/dict-data/update', data })
}

// 删除字典数据
export const deleteDictData = (id: number) => {
  return defHttp.delete({ url: '/system/dict-data/delete?id=' + id })
}
// 导出字典类型数据
export const exportDictData = (params: DictDataExportReqVO) => {
  return defHttp.get({ url: '/system/dict-data/export', params })
}
