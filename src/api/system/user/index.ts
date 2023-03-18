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
export const getUserPageApi = (params: UserPageReqVO) => {
  return defHttp.get({ url: '/system/user/page', params })
}

// 查询用户详情
export const getUserApi = (id: number) => {
  return defHttp.get({ url: '/system/user/get?id=' + id })
}

// 新增用户
export const createUserApi = (data: UserVO) => {
  return defHttp.post({ url: '/system/user/create', data })
}

// 修改用户
export const updateUserApi = (data: UserVO) => {
  return defHttp.put({ url: '/system/user/update', data })
}

// 删除用户
export const deleteUserApi = (id: number) => {
  return defHttp.delete({ url: '/system/user/delete?id=' + id })
}

// 导出用户
export const exportUserApi = (params: UserExportReqVO) => {
  return defHttp.download({ url: '/system/user/export', params })
}

// 下载用户导入模板
export const importUserTemplateApi = () => {
  return defHttp.download({ url: '/system/user/get-import-template' })
}

// 用户密码重置
export const resetUserPwdApi = (id: number, password: string) => {
  const data = {
    id,
    password
  }
  return defHttp.put({ url: '/system/user/update-password', data: data })
}

// 用户状态修改
export const updateUserStatusApi = (id: number, status: number) => {
  const data = {
    id,
    status
  }
  return defHttp.put({ url: '/system/user/update-status', data: data })
}

// 获取用户精简信息列表
export const getListSimpleUsersApi = () => {
  return defHttp.get({ url: '/system/user/list-all-simple' })
}
