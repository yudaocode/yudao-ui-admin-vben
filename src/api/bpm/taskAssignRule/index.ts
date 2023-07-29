import { defHttp } from '@/utils/http/axios'

export interface TaskAssignVO {
  id: number
  modelId: string
  processDefinitionId: string
  taskDefinitionKey: string
  taskDefinitionName: string
  options: string[]
  type: number
}

export function getTaskAssignRuleList(params) {
  return defHttp.get({ url: '/bpm/task-assign-rule/list', params })
}

export function createTaskAssignRule(data: TaskAssignVO) {
  return defHttp.post({ url: '/bpm/task-assign-rule/create', data })
}

export function updateTaskAssignRule(data: TaskAssignVO) {
  return defHttp.put({ url: '/bpm/task-assign-rule/update', data })
}
