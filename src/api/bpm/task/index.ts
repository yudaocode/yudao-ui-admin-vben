import { defHttp } from '@/utils/http/axios'

export const getTodoTaskPage = (params) => {
  return defHttp.get({ url: '/bpm/task/todo-page', params })
}

export const getDoneTaskPage = (params) => {
  return defHttp.get({ url: '/bpm/task/done-page', params })
}

export const completeTask = (data) => {
  return defHttp.put({ url: '/bpm/task/complete', data })
}

export const approveTask = (data) => {
  return defHttp.put({ url: '/bpm/task/approve', data })
}

export const rejectTask = (data) => {
  return defHttp.put({ url: '/bpm/task/reject', data })
}
export const backTask = (data) => {
  return defHttp.put({ url: '/bpm/task/back', data })
}

export const updateTaskAssignee = (data) => {
  return defHttp.put({ url: '/bpm/task/update-assignee', data })
}

export const getTaskListByProcessInstanceId = (processInstanceId) => {
  return defHttp.get({
    url: '/bpm/task/list-by-process-instance-id?processInstanceId=' + processInstanceId
  })
}
