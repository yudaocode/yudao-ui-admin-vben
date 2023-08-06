import { defHttp } from '@/utils/http/axios'

export interface NoticeVO {
  id: number
  title: string
  type: number
  content: string
  status: number
  remark: string
  creator: string
  createTime: Date
}

export interface NoticePageReqVO extends PageParam {
  title?: string
  status?: number
}

// 查询公告列表
export function getNoticePage(params: NoticePageReqVO) {
  return defHttp.get({ url: '/system/notice/page', params })
}

// 查询公告详情
export function getNotice(id: number) {
  return defHttp.get({ url: `/system/notice/get?id=${id}` })
}

// 新增公告
export function createNotice(data: NoticeVO) {
  return defHttp.post({ url: '/system/notice/create', data })
}

// 修改公告
export function updateNotice(data: NoticeVO) {
  return defHttp.put({ url: '/system/notice/update', data })
}

// 删除公告
export function deleteNotice(id: number) {
  return defHttp.delete({ url: `/system/notice/delete?id=${id}` })
}
