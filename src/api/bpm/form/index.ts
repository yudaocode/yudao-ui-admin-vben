import { defHttp } from '@/utils/http/axios'

export interface FormVO {
  id: number
  name: string
  conf: string
  fields: string[]
  status: number
  remark: string
  createTime: string
}

// 创建工作流的表单定义
export function createForm(data: FormVO) {
  return defHttp.post({ url: '/bpm/form/create', data })
}

// 更新工作流的表单定义
export function updateForm(data: FormVO) {
  return defHttp.put({ url: '/bpm/form/update', data })
}

// 删除工作流的表单定义
export function deleteForm(id: number) {
  return defHttp.delete({ url: `/bpm/form/delete?id=${id}` })
}

// 获得工作流的表单定义
export function getForm(id: number) {
  return defHttp.get({ url: `/bpm/form/get?id=${id}` })
}

// 获得工作流的表单定义分页
export function getFormPage(params) {
  return defHttp.get({ url: '/bpm/form/page', params })
}

// 获得动态表单的精简列表
export function getSimpleForms() {
  return defHttp.get({ url: '/bpm/form/list-all-simple' })
}
