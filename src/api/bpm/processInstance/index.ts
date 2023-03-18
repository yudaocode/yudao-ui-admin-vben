import { defHttp } from '@/utils/http/axios'
import { ProcessInstanceVO } from './types'

export const getMyProcessInstancePageApi = (params) => {
  return defHttp.get({ url: '/bpm/process-instance/my-page', params })
}

export const createProcessInstanceApi = (data: ProcessInstanceVO) => {
  return defHttp.post({ url: '/bpm/process-instance/create', data: data })
}

export const cancelProcessInstanceApi = (id: number, reason: string) => {
  const data = {
    id: id,
    reason: reason
  }
  return defHttp.delete({ url: '/bpm/process-instance/cancel', data: data })
}

export const getProcessInstanceApi = (id: number) => {
  return defHttp.get({ url: '/bpm/process-instance/get?id=' + id })
}
