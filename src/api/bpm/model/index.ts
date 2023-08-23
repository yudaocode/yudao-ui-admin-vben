import { defHttp } from '@/utils/http/axios'

export interface ProcessDefinitionVO {
  id: string
  version: number
  deploymentTIme: string
  suspensionState: number
}

export interface ModelVO {
  id: number
  formName: string
  key: string
  name: string
  description: string
  category: string
  formType: number
  formId: number
  formCustomCreatePath: string
  formCustomViewPath: string
  processDefinition: ProcessDefinitionVO
  status: number
  remark: string
  createTime: string
}

export function getModelPage(params) {
  return defHttp.get({ url: '/bpm/model/page', params })
}

export function getModel(id: number) {
  return defHttp.get({ url: `/bpm/model/get?id=${id}` })
}

export function updateModel(data: ModelVO) {
  return defHttp.put({ url: '/bpm/model/update', data })
}

// 任务状态修改
export function updateModelState(id: number, state: number) {
  const data = {
    id,
    state,
  }
  return defHttp.put({ url: '/bpm/model/update-state', data })
}

export function createModel(data: ModelVO) {
  return defHttp.post({ url: '/bpm/model/create', data })
}

export function deleteModel(id: number) {
  return defHttp.delete({ url: `/bpm/model/delete?id=${id}` })
}

export function deployModel(id: number) {
  return defHttp.post({ url: `/bpm/model/deploy?id=${id}` })
}

export function importModel(data) {
  return defHttp.post({ url: '/bpm/model/import', data })
}
