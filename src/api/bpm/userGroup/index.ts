import { defHttp } from '@/utils/http/axios'
import { UserGroupVO } from './types'

// 创建用户组
export const createUserGroupApi = (data: UserGroupVO) => {
  return defHttp.post({
    url: '/bpm/user-group/create',
    data: data
  })
}

// 更新用户组
export const updateUserGroupApi = (data: UserGroupVO) => {
  return defHttp.put({
    url: '/bpm/user-group/update',
    data: data
  })
}

// 删除用户组
export const deleteUserGroupApi = (id: number) => {
  return defHttp.delete({ url: '/bpm/user-group/delete?id=' + id })
}

// 获得用户组
export const getUserGroupApi = (id: number) => {
  return defHttp.get({ url: '/bpm/user-group/get?id=' + id })
}

// 获得用户组分页
export const getUserGroupPageApi = (params) => {
  return defHttp.get({ url: '/bpm/user-group/page', params })
}

// 获取用户组精简信息列表
export const listSimpleUserGroupsApi = () => {
  return defHttp.get({ url: '/bpm/user-group/list-all-simple' })
}
