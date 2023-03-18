import { defHttp } from '@/utils/http/axios'

export interface PermissionAssignUserRoleReqVO {
  userId: number
  roleIds: number[]
}

export interface PermissionAssignRoleMenuReqVO {
  roleId: number
  menuIds: number[]
}

export interface PermissionAssignRoleDataScopeReqVO {
  roleId: number
  dataScope: number
  dataScopeDeptIds: number[]
}

// 查询角色拥有的菜单权限
export const listRoleMenusApi = (roleId: number) => {
  return defHttp.get({ url: '/system/permission/list-role-resources?roleId=' + roleId })
}

// 赋予角色菜单权限
export const assignRoleMenuApi = (data: PermissionAssignRoleMenuReqVO) => {
  return defHttp.post({ url: '/system/permission/assign-role-menu', data })
}

// 赋予角色数据权限
export const assignRoleDataScopeApi = (data: PermissionAssignRoleDataScopeReqVO) => {
  return defHttp.post({ url: '/system/permission/assign-role-data-scope', data })
}

// 查询用户拥有的角色数组
export const listUserRolesApi = (userId: number) => {
  return defHttp.get({ url: '/system/permission/list-user-roles?userId=' + userId })
}

// 赋予用户角色
export const aassignUserRoleApi = (data: PermissionAssignUserRoleReqVO) => {
  return defHttp.post({ url: '/system/permission/assign-user-role', data })
}
