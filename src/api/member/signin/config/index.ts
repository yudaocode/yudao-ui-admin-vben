import { defHttp } from '@/utils/http/axios'

export interface SignInConfigVO {
  id: number
  day: number | null
  point: number | null
  enable: boolean | null
}

// 查询积分签到规则列表
export function getSignInConfigList() {
  return defHttp.get({ url: '/member/point/sign-in-config/list' })
}

// 查询积分签到规则详情
export function getSignInConfig(id: number) {
  return defHttp.get({ url: `/member/point/sign-in-config/get?id=${id}` })
}

// 新增积分签到规则
export function createSignInConfig(data: SignInConfigVO) {
  return defHttp.post({ url: '/member/point/sign-in-config/create', data })
}

// 修改积分签到规则
export function updateSignInConfig(data: SignInConfigVO) {
  return defHttp.put({ url: '/member/point/sign-in-config/update', data })
}

// 删除积分签到规则
export function deleteSignInConfig(id: number) {
  return defHttp.delete({ url: `/member/point/sign-in-config/delete?id=${id}` })
}
