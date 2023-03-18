import { defHttp } from '@/utils/http/axios'
import { ModelVO } from './types'

export const getModelPageApi = (params) => {
  return defHttp.get({ url: '/bpm/model/page', params })
}

export const getModelApi = (id: number) => {
  return defHttp.get({ url: '/bpm/model/get?id=' + id })
}

export const updateModelApi = (data: ModelVO) => {
  return defHttp.put({ url: '/bpm/model/update', data: data })
}

// 任务状态修改
export const updateModelStateApi = (id: number, state: number) => {
  const data = {
    id: id,
    state: state
  }
  return defHttp.put({ url: '/bpm/model/update-state', data: data })
}

export const createModelApi = (data: ModelVO) => {
  return defHttp.post({ url: '/bpm/model/create', data: data })
}

export const deleteModelApi = (id: number) => {
  return defHttp.delete({ url: '/bpm/model/delete?id=' + id })
}

export const deployModelApi = (id: number) => {
  return defHttp.post({ url: '/bpm/model/deploy?id=' + id })
}
