import { defHttp } from '@/utils/http/axios'

export interface TenantPackageVO {
  id: number
  name: string
  status: number
  remark: string
  creator: string
  updater: string
  updateTime: string
  menuIds: number[]
  createTime: Date
}

export interface TenantPackagePageReqVO extends PageParam {
  name?: string
  status?: number
  remark?: string
  createTime?: Date[]
}

// 查询租户套餐列表
export const getTenantPackageTypePageApi = (params: TenantPackagePageReqVO) => {
  return defHttp.get({ url: '/system/tenant-package/page', params })
}

// 获得租户
export const getTenantPackageApi = (id: number) => {
  return defHttp.get({ url: '/system/tenant-package/get?id=' + id })
}

// 新增租户套餐
export const createTenantPackageTypeApi = (data: TenantPackageVO) => {
  return defHttp.post({ url: '/system/tenant-package/create', data })
}

// 修改租户套餐
export const updateTenantPackageTypeApi = (data: TenantPackageVO) => {
  return defHttp.put({ url: '/system/tenant-package/update', data })
}

// 删除租户套餐
export const deleteTenantPackageTypeApi = (id: number) => {
  return defHttp.delete({ url: '/system/tenant-package/delete?id=' + id })
}
// 获取租户套餐精简信息列表
export const getTenantPackageList = () => {
  return defHttp.get({ url: '/system/tenant-package/get-simple-list' })
}
