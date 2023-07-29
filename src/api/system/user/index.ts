import { defHttp } from '@/utils/http/axios'

export interface UserVO {
  id: number
  username: string
  nickname: string
  deptId: number
  postIds: string[]
  email: string
  mobile: string
  sex: number
  avatar: string
  loginIp: string
  status: number
  remark: string
  loginDate: Date
  createTime: Date
}

export interface UserPageReqVO extends PageParam {
  deptId?: number
  username?: string
  mobile?: string
  status?: number
  createTime?: Date[]
}

export interface UserExportReqVO {
  code?: string
  name?: string
  status?: number
  createTime?: Date[]
}

// 查询用户管理列表
export function getUserPage(params: UserPageReqVO) {
  return defHttp.get({ url: '/system/user/page', params })
}

// 查询用户详情
export function getUser(id: number) {
  return defHttp.get({ url: `/system/user/get?id=${id}` })
}

// 新增用户
export function createUser(data: UserVO) {
  return defHttp.post({ url: '/system/user/create', data })
}

// 修改用户
export function updateUser(data: UserVO) {
  return defHttp.put({ url: '/system/user/update', data })
}

// 删除用户
export function deleteUser(id: number) {
  return defHttp.delete({ url: `/system/user/delete?id=${id}` })
}

// 导出用户
export function exportUser(params: UserExportReqVO) {
  return defHttp.download({ url: '/system/user/export', params }, '用户.xls')
}

// 下载用户导入模板
export function importUserTemplate() {
  return defHttp.download({ url: '/system/user/get-import-template' }, '用户导入模板.xls')
}

// 用户密码重置
export function resetUserPwd(id: number, password: string) {
  const data = {
    id,
    password,
  }
  return defHttp.put({ url: '/system/user/update-password', data })
}

// 用户状态修改
export function updateUserStatus(id: number, status: number) {
  const data = {
    id,
    status,
  }
  return defHttp.put({ url: '/system/user/update-status', data })
}

// 获取用户精简信息列表
export function getListSimpleUsers() {
  return defHttp.get({ url: '/system/user/list-all-simple' })
}
