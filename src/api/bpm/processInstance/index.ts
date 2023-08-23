import { defHttp } from '@/utils/http/axios'

export function getMyProcessInstancePage(params) {
  return defHttp.get({ url: '/bpm/process-instance/my-page', params })
}

export function createProcessInstance(data) {
  return defHttp.post({ url: '/bpm/process-instance/create', data })
}

export function cancelProcessInstance(id: number, reason: string) {
  const data = {
    id,
    reason,
  }
  return defHttp.delete({ url: '/bpm/process-instance/cancel', data })
}

export function getProcessInstance(id: number) {
  return defHttp.get({ url: `/bpm/process-instance/get?id=${id}` })
}
