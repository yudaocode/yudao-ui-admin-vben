import { defHttp } from '@/utils/http/axios'

export interface TenantVO {
  id: number
  name: string
  contactName: string
  contactMobile: string
  status: number
  domain: string
  packageId: number
  username: string
  password: string
  expireTime: Date
  accountCount: number
  createTime: Date
}

export interface TenantPageReqVO extends PageParam {
  name?: string
  contactName?: string
  contactMobile?: string
  status?: number
  createTime?: Date[]
}

export interface TenantExportReqVO {
  name?: string
  contactName?: string
  contactMobile?: string
  status?: number
  createTime?: Date[]
}

// 查询租户列表
export function getTenantPage(params: TenantPageReqVO) {
  return defHttp.get({ url: '/system/tenant/page', params })
}

// 查询租户详情
export function getTenant(id: number) {
  return defHttp.get({ url: `/system/tenant/get?id=${id}` })
}

// 新增租户
export function createTenant(data: TenantVO) {
  return defHttp.post({ url: '/system/tenant/create', data })
}

// 修改租户
export function updateTenant(data: TenantVO) {
  return defHttp.put({ url: '/system/tenant/update', data })
}

// 删除租户
export function deleteTenant(id: number) {
  return defHttp.delete({ url: `/system/tenant/delete?id=${id}` })
}

// 导出租户
export function exportTenant(params: TenantExportReqVO) {
  return defHttp.download({ url: '/system/tenant/export-excel', params }, '租户.xls')
}
