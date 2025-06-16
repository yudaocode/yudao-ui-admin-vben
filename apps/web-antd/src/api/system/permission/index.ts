import { requestClient } from '#/api/request';

export namespace SystemPermissionApi {
  /** 分配用户角色请求 */
  export interface AssignUserRoleReq {
    userId: number;
    roleIds: number[];
  }

  /** 分配角色菜单请求 */
  export interface AssignRoleMenuReq {
    roleId: number;
    menuIds: number[];
  }

  /** 分配角色数据权限请求 */
  export interface AssignRoleDataScopeReq {
    roleId: number;
    dataScope: number;
    dataScopeDeptIds: number[];
  }
}

/** 查询角色拥有的菜单权限 */
export async function getRoleMenuList(roleId: number) {
  return requestClient.get(
    `/system/permission/list-role-menus?roleId=${roleId}`,
  );
}

/** 赋予角色菜单权限 */
export async function assignRoleMenu(
  data: SystemPermissionApi.AssignRoleMenuReq,
) {
  return requestClient.post('/system/permission/assign-role-menu', data);
}

/** 赋予角色数据权限 */
export async function assignRoleDataScope(
  data: SystemPermissionApi.AssignRoleDataScopeReq,
) {
  return requestClient.post('/system/permission/assign-role-data-scope', data);
}

/** 查询用户拥有的角色数组 */
export async function getUserRoleList(userId: number) {
  return requestClient.get(
    `/system/permission/list-user-roles?userId=${userId}`,
  );
}

/** 赋予用户角色 */
export async function assignUserRole(
  data: SystemPermissionApi.AssignUserRoleReq,
) {
  return requestClient.post('/system/permission/assign-user-role', data);
}
