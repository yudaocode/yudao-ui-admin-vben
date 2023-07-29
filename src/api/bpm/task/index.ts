import { defHttp } from '@/utils/http/axios'

export function getTodoTaskPage(params) {
  return defHttp.get({ url: '/bpm/task/todo-page', params })
}

export function getDoneTaskPage(params) {
  return defHttp.get({ url: '/bpm/task/done-page', params })
}

export function completeTask(data) {
  return defHttp.put({ url: '/bpm/task/complete', data })
}

export function approveTask(data) {
  return defHttp.put({ url: '/bpm/task/approve', data })
}

export function rejectTask(data) {
  return defHttp.put({ url: '/bpm/task/reject', data })
}
export function backTask(data) {
  return defHttp.put({ url: '/bpm/task/back', data })
}

export function updateTaskAssignee(data) {
  return defHttp.put({ url: '/bpm/task/update-assignee', data })
}

export function getTaskListByProcessInstanceId(processInstanceId) {
  return defHttp.get({
    url: `/bpm/task/list-by-process-instance-id?processInstanceId=${processInstanceId}`,
  })
}
