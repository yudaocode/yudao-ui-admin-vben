import { defHttp } from '@/utils/http/axios'

export interface SignInConfigVO {
  id?: number
  day?: number
  point?: number
  experience?: number
  status?: number
}

// 查询积分签到规则列表
export function getSignInConfigList() {
  return defHttp.get({ url: '/member/sign-in/config/list' })
}

// 查询积分签到规则详情
export function getSignInConfig(id: number) {
  return defHttp.get({ url: `/member/sign-in/config/get?id=${id}` })
}

// 新增积分签到规则
export function createSignInConfig(data: SignInConfigVO) {
  return defHttp.post({ url: '/member/sign-in/config/create', data })
}

// 修改积分签到规则
export function updateSignInConfig(data: SignInConfigVO) {
  return defHttp.put({ url: '/member/sign-in/config/update', data })
}

// 删除积分签到规则
export function deleteSignInConfig(id: number) {
  return defHttp.delete({ url: `/member/sign-in/config/delete?id=${id}` })
}
