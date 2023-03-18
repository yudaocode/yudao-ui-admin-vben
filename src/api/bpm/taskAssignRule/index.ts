import { defHttp } from '@/utils/http/axios'
import { TaskAssignVO } from './types'

export const getTaskAssignRuleList = (params) => {
  return defHttp.get({ url: '/bpm/task-assign-rule/list', params })
}

export const createTaskAssignRule = (data: TaskAssignVO) => {
  return defHttp.post({
    url: '/bpm/task-assign-rule/create',
    data: data
  })
}

export const updateTaskAssignRule = (data: TaskAssignVO) => {
  return defHttp.put({
    url: '/bpm/task-assign-rule/update',
    data: data
  })
}
