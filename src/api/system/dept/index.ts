import { defHttp } from '@/utils/http/axios'

export interface DeptVO {
  id?: number
  name: string
  parentId: number
  status: number
  sort: number
  leaderUserId: number
  phone: string
  email: string
  createTime: Date
}

export interface DeptPageReqVO {
  name?: string
  status?: number
}

// 查询部门（精简)列表
export function listSimpleDept() {
  return defHttp.get({ url: '/system/dept/list-all-simple' })
}

// 查询部门列表
export function getDeptPage(params: DeptPageReqVO) {
  return defHttp.get({ url: '/system/dept/list', params })
}

// 查询部门详情
export function getDept(id: number) {
  return defHttp.get({ url: `/system/dept/get?id=${id}` })
}

// 新增部门
export function createDept(data: DeptVO) {
  return defHttp.post({ url: '/system/dept/create', data })
}

// 修改部门
export function updateDept(params: DeptVO) {
  return defHttp.put({ url: '/system/dept/update', data: params })
}

// 删除部门
export function deleteDept(id: number) {
  return defHttp.delete({ url: `/system/dept/delete?id=${id}` })
}
