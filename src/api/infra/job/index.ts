import { defHttp } from '@/utils/http/axios'

export interface JobVO {
  id: number
  name: string
  status: number
  handlerName: string
  handlerParam: string
  cronExpression: string
  retryCount: number
  retryInterval: number
  monitorTimeout: number
  createTime: Date
}

export interface JobPageReqVO extends PageParam {
  name?: string
  status?: number
  handlerName?: string
}

export interface JobExportReqVO {
  name?: string
  status?: number
  handlerName?: string
}

// 任务列表
export function getJobPage(params: JobPageReqVO) {
  return defHttp.get({ url: '/infra/job/page', params })
}

// 任务详情
export function getJob(id: number) {
  return defHttp.get({ url: `/infra/job/get?id=${id}` })
}

// 新增任务
export function createJob(data: JobVO) {
  return defHttp.post({ url: '/infra/job/create', data })
}

// 修改定时任务调度
export function updateJob(data: JobVO) {
  return defHttp.put({ url: '/infra/job/update', data })
}

// 删除定时任务调度
export function deleteJob(id: number) {
  return defHttp.delete({ url: `/infra/job/delete?id=${id}` })
}

// 导出定时任务调度
export function exportJob(params: JobExportReqVO) {
  return defHttp.download({ url: '/infra/job/export-excel', params }, '定时任务.xls')
}

// 任务状态修改
export function updateJobStatus(id: number, status: number) {
  return defHttp.put({ url: `/infra/job/update-status?id=${id}&status=${status}` })
}

// 定时任务立即执行一次
export function runJob(id: number) {
  return defHttp.put({ url: `/infra/job/trigger?id=${id}` })
}

// 获得定时任务的下 n 次执行时间
export function getJobNextTimes(id: number) {
  return defHttp.get({ url: `/infra/job/get_next_times?id=${id}` })
}
