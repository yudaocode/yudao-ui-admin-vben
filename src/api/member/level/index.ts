import { defHttp } from '@/utils/http/axios'

export interface LevelVO {
  id: number
  name: string
  experience: number
  value: number
  discountPercent: number
  icon: string
  bgUrl: string
  status: number
}

// 查询会员等级列表
export function getLevelList(params) {
  return defHttp.get({ url: '/member/level/list', params })
}

// 查询会员等级详情
export function getLevel(id: number) {
  return defHttp.get({ url: `/member/level/get?id=${id}` })
}

// 查询会员等级 - 精简信息列表
export function getSimpleLevelList() {
  return defHttp.get({ url: '/member/level/list-all-simple' })
}

// 新增会员等级
export function createLevel(data: LevelVO) {
  return defHttp.post({ url: '/member/level/create', data })
}

// 修改会员等级
export function updateLevel(data: LevelVO) {
  return defHttp.put({ url: '/member/level/update', data })
}

// 删除会员等级
export function deleteLevel(id: number) {
  return defHttp.delete({ url: `/member/level/delete?id=${id}` })
}
