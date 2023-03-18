import { defHttp } from '@/utils/http/axios'
import type { DictDataVO, DictDataPageReqVO, DictDataExportReqVO } from './types'

// 查询字典数据（精简)列表
export const listSimpleDictDataApi = () => {
  return defHttp.get({ url: '/system/dict-data/list-all-simple' })
}

// 查询字典数据列表
export const getDictDataPageApi = (params: DictDataPageReqVO) => {
  return defHttp.get({ url: '/system/dict-data/page', params })
}

// 查询字典数据详情
export const getDictDataApi = (id: number) => {
  return defHttp.get({ url: '/system/dict-data/get?id=' + id })
}

// 新增字典数据
export const createDictDataApi = (data: DictDataVO) => {
  return defHttp.post({ url: '/system/dict-data/create', data })
}

// 修改字典数据
export const updateDictDataApi = (data: DictDataVO) => {
  return defHttp.put({ url: '/system/dict-data/update', data })
}

// 删除字典数据
export const deleteDictDataApi = (id: number) => {
  return defHttp.delete({ url: '/system/dict-data/delete?id=' + id })
}
// 导出字典类型数据
export const exportDictDataApi = (params: DictDataExportReqVO) => {
  return defHttp.get({ url: '/system/dict-data/export', params })
}
