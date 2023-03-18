import { defHttp } from '@/utils/http/axios'

export interface ErrorCodeVO {
  id: number
  type: number
  applicationName: string
  code: number
  message: string
  memo: string
  createTime: Date
}

export interface ErrorCodePageReqVO extends PageParam {
  type?: number
  applicationName?: string
  code?: number
  message?: string
  createTime?: Date[]
}

// 查询错误码列表
export const getErrorCodePageApi = (params: ErrorCodePageReqVO) => {
  return defHttp.get({ url: '/system/error-code/page', params })
}

// 查询错误码详情
export const getErrorCodeApi = (id: number) => {
  return defHttp.get({ url: '/system/error-code/get?id=' + id })
}

// 新增错误码
export const createErrorCodeApi = (data: ErrorCodeVO) => {
  return defHttp.post({ url: '/system/error-code/create', data })
}

// 修改错误码
export const updateErrorCodeApi = (data: ErrorCodeVO) => {
  return defHttp.put({ url: '/system/error-code/update', data })
}

// 删除错误码
export const deleteErrorCodeApi = (id: number) => {
  return defHttp.delete({ url: '/system/error-code/delete?id=' + id })
}
// 导出错误码
export const excelErrorCodeApi = (params: ErrorCodePageReqVO) => {
  return defHttp.download({ url: '/system/error-code/export-excel', params })
}
