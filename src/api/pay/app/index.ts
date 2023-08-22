import { defHttp } from '@/utils/http/axios'

export interface AppVO {
  id: number
  name: string
  status: number
  remark: string
  payNotifyUrl: string
  refundNotifyUrl: string
  merchantId: number
  merchantName: string
  createTime: Date
}

export interface AppPageReqVO extends PageParam {
  name?: string
  status?: number
  remark?: string
  payNotifyUrl?: string
  refundNotifyUrl?: string
  merchantName?: string
  createTime?: Date[]
}

export interface AppExportReqVO {
  name?: string
  status?: number
  remark?: string
  payNotifyUrl?: string
  refundNotifyUrl?: string
  merchantName?: string
  createTime?: Date[]
}

export interface AppUpdateStatusReqVO {
  id: number
  status: number
}

// 查询列表支付应用
export function getAppPage(params: AppPageReqVO) {
  return defHttp.get({ url: '/pay/app/page', params })
}

// 查询详情支付应用
export function getApp(id: number) {
  return defHttp.get({ url: `/pay/app/get?id=${id}` })
}

// 新增支付应用
export function createApp(data: AppVO) {
  return defHttp.post({ url: '/pay/app/create', data })
}

// 修改支付应用
export function updateApp(data: AppVO) {
  return defHttp.put({ url: '/pay/app/update', data })
}

// 支付应用信息状态修改
export function changeAppStatus(data: AppUpdateStatusReqVO) {
  return defHttp.put({ url: '/pay/app/update-status', data })
}

// 删除支付应用
export function deleteApp(id: number) {
  return defHttp.delete({ url: `/pay/app/delete?id=${id}` })
}

// 导出支付应用
export function exportApp(params: AppExportReqVO) {
  return defHttp.download({ url: '/pay/app/export-excel', params }, '支付应用.xls')
}

// 根据商ID称搜索应用列表
export function getAppListByMerchantId(merchantId: number) {
  return defHttp.get({ url: '/pay/app/list-merchant-id', params: { merchantId } })
}

// 获得支付应用列表
export function getAppList() {
  return defHttp.get({ url: '/pay/app/list' })
}
