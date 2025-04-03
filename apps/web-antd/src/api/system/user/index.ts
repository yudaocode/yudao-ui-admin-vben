import type { PageParam } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  /** 用户信息 */
  export interface SystemUser {
    id?: number;
    username: string;
    nickname: string;
    deptId: number;
    postIds: string[];
    email: string;
    mobile: string;
    sex: number;
    avatar: string;
    loginIp: string;
    status: number;
    remark: string;
    createTime?: Date;
  }
}

/** 查询用户管理列表 */
export function getUserPage(params: PageParam) {
  return requestClient.get('/system/user/page', { params });
}

/** 查询所有用户列表 */
export function getAllUser() {
  return requestClient.get('/system/user/all');
}

/** 查询用户详情 */
export function getUser(id: number) {
  return requestClient.get(`/system/user/get?id=${id}`);
}

/** 新增用户 */
export function createUser(data: SystemUserApi.SystemUser) {
  return requestClient.post('/system/user/create', data);
}

/** 修改用户 */
export function updateUser(data: SystemUserApi.SystemUser) {
  return requestClient.put('/system/user/update', data);
}

/** 删除用户 */
export function deleteUser(id: number) {
  return requestClient.delete(`/system/user/delete?id=${id}`);
}

/** 导出用户 */
export function exportUser(params: any) {
  return requestClient.download('/system/user/export', params);
}

/** 下载用户导入模板 */
export function importUserTemplate() {
  return requestClient.download('/system/user/get-import-template');
}

/** 用户密码重置 */
export function resetUserPwd(id: number, password: string) {
  return requestClient.put('/system/user/update-password', { id, password });
}

/** 用户状态修改 */
export function updateUserStatus(id: number, status: number) {
  return requestClient.put('/system/user/update-status', { id, status });
}

/** 获取用户精简信息列表 */
export function getSimpleUserList(): Promise<SystemUserApi.SystemUser[]> {
  return requestClient.get('/system/user/simple-list');
}
