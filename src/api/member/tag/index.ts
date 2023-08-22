import { defHttp } from '@/utils/http/axios'

export interface TagVO {
  id: number
  name: string
}

// 查询会员标签列表
export function getMemberTagPage(params) {
  return defHttp.get({ url: '/member/tag/page', params })
}

// 查询会员标签详情
export function getMemberTag(id: number) {
  return defHttp.get({ url: `/member/tag/get?id=${id}` })
}

// 新增会员标签
export function createMemberTag(data: TagVO) {
  return defHttp.post({ url: '/member/tag/create', data })
}

// 修改会员标签
export function updateMemberTag(data: TagVO) {
  return defHttp.put({ url: '/member/tag/update', data })
}

// 删除会员标签
export function deleteMemberTag(id: number) {
  return defHttp.delete({ url: `/member/tag/delete?id=${id}` })
}
