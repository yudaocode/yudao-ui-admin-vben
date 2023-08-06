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

export interface RoleExportReqVO {
  name?: string
  code?: string
  status?: number
  createTime?: Date[]
}

// 查询角色列表
export function getRolePage(params: RolePageReqVO) {
  return defHttp.get({ url: '/system/role/page', params })
}

// 查询角色（精简)列表
export function listSimpleRoles() {
  return defHttp.get({ url: '/system/role/list-all-simple' })
}

// 查询角色详情
export function getRole(id: number) {
  return defHttp.get({ url: `/system/role/get?id=${id}` })
}

// 新增角色
export function createRole(data: RoleVO) {
  return defHttp.post({ url: '/system/role/create', data })
}

// 修改角色
export function updateRole(data: RoleVO) {
  return defHttp.put({ url: '/system/role/update', data })
}

// 修改角色状态
export function updateRoleStatus(data: UpdateStatusReqVO) {
  return defHttp.put({ url: '/system/role/update-status', data })
}

// 删除角色
export function deleteRole(id: number) {
  return defHttp.delete({ url: `/system/role/delete?id=${id}` })
}

// 导出角色
export function exportRole(params: RoleExportReqVO) {
  return defHttp.download({ url: '/system/post/export', params }, '导出角色.xls')
}
