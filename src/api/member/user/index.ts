import { defHttp } from '@/utils/http/axios'

export interface UserVO {
  id: number
  mobile: string
  password: string
  status: number
  registerIp: string
  loginIp: string
  loginDate: Date
  nickname: string
  avatar: string
  name: string
  sex: number
  areaId: number
  birthday: Date
  mark: string
  createTime: Date
}

// 查询会员用户列表
export function getUserPage(params) {
  return defHttp.get({ url: '/member/user/page', params })
}

// 查询会员用户详情
export function getUser(id: number) {
  return defHttp.get({ url: `/member/user/get?id=${id}` })
}

// 修改会员用户
export function updateUser(data: UserVO) {
  return defHttp.put({ url: '/member/user/update', data })
}
