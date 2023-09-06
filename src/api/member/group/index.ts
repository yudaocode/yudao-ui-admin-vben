import { defHttp } from '@/utils/http/axios'

export interface GroupVO {
  id: number
  name: string
  remark: string
  status: number
}

// 查询用户分组列表
export function getGroupPage(params: any) {
  return defHttp.get({ url: '/member/group/page', params })
}

// 查询用户分组详情
export function getGroup(id: number) {
  return defHttp.get({ url: `/member/group/get?id=${id}` })
}

// 新增用户分组
export function createGroup(data: GroupVO) {
  return defHttp.post({ url: '/member/group/create', data })
}

// 查询用户分组 - 精简信息列表
export function getSimpleGroupList() {
  return defHttp.get({ url: '/member/group/list-all-simple' })
}

// 修改用户分组
export function updateGroup(data: GroupVO) {
  return defHttp.put({ url: '/member/group/update', data })
}

// 删除用户分组
export function deleteGroup(id: number) {
  return defHttp.delete({ url: `/member/group/delete?id=${id}` })
}
