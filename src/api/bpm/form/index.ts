import { defHttp } from '@/utils/http/axios'
import { FormVO } from './types'

// 创建工作流的表单定义
export const createFormApi = (data: FormVO) => {
  return defHttp.post({ url: '/bpm/form/create', data: data })
}

// 更新工作流的表单定义
export const updateFormApi = (data: FormVO) => {
  return defHttp.put({ url: '/bpm/form/update', data: data })
}

// 删除工作流的表单定义
export const deleteFormApi = (id: number) => {
  return defHttp.delete({ url: '/bpm/form/delete?id=' + id })
}

// 获得工作流的表单定义
export const getFormApi = (id: number) => {
  return defHttp.get({ url: '/bpm/form/get?id=' + id })
}

// 获得工作流的表单定义分页
export const getFormPageApi = (params) => {
  return defHttp.get({ url: '/bpm/form/page', params })
}

// 获得动态表单的精简列表
export const getSimpleFormsApi = async () => {
  return await defHttp.get({ url: '/bpm/form/list-all-simple' })
}
