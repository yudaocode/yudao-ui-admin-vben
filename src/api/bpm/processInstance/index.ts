import { defHttp } from '@/utils/http/axios'

export interface task {
  id: string
  name: string
}
export interface ProcessInstanceVO {
  id: number
  name: string
  processDefinitionId: string
  category: string
  result: number
  tasks: task[]
  fields: string[]
  status: number
  remark: string
  businessKey: string
  createTime: string
  endTime: string
}

export function getMyProcessInstancePage(params) {
  return defHttp.get({ url: '/bpm/process-instance/my-page', params })
}

export function createProcessInstance(data: ProcessInstanceVO) {
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
