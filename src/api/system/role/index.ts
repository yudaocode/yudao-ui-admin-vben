import { defHttp } from '@/utils/http/axios'

export interface RoleVO {
  id: number
  name: string
  code: string
  sort: number
  status: number
  type: number
  createTime: Date
}

export interface RolePageReqVO extends PageParam {
  name?: string
  code?: string
  status?: number
  createTime?: Date[]
}

export interface UpdateStatusReqVO {
  id: number
  status: number
}

// 查询角色列表
export const getRolePageApi = (params: RolePageReqVO) => {
  return defHttp.get({ url: '/system/role/page', params })
}

// 查询角色（精简)列表
export const listSimpleRolesApi = () => {
  return defHttp.get({ url: '/system/role/list-all-simple' })
}

// 查询角色详情
export const getRoleApi = (id: number) => {
  return defHttp.get({ url: '/system/role/get?id=' + id })
}

// 新增角色
export const createRoleApi = (data: RoleVO) => {
  return defHttp.post({ url: '/system/role/create', data })
}

// 修改角色
export const updateRoleApi = (data: RoleVO) => {
  return defHttp.put({ url: '/system/role/update', data })
}

// 修改角色状态
export const updateRoleStatusApi = (data: UpdateStatusReqVO) => {
  return defHttp.put({ url: '/system/role/update-status', data })
}

// 删除角色
export const deleteRoleApi = (id: number) => {
  return defHttp.delete({ url: '/system/role/delete?id=' + id })
}
