import { defHttp } from '@/utils/http/axios'

export interface UserGroupVO {
  id: number
  name: string
  description: string
  memberUserIds: number[]
  status: number
  remark: string
  createTime: string
}

// 创建用户组
export function createUserGroup(data: UserGroupVO) {
  return defHttp.post({ url: '/bpm/user-group/create', data })
}

// 更新用户组
export function updateUserGroup(data: UserGroupVO) {
  return defHttp.put({ url: '/bpm/user-group/update', data })
}

// 删除用户组
export function deleteUserGroup(id: number) {
  return defHttp.delete({ url: `/bpm/user-group/delete?id=${id}` })
}

// 获得用户组
export function getUserGroup(id: number) {
  return defHttp.get({ url: `/bpm/user-group/get?id=${id}` })
}

// 获得用户组分页
export function getUserGroupPage(params) {
  return defHttp.get({ url: '/bpm/user-group/page', params })
}

// 获取用户组精简信息列表
export function listSimpleUserGroups() {
  return defHttp.get({ url: '/bpm/user-group/list-all-simple' })
}
