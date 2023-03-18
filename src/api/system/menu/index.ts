import { defHttp } from '@/utils/http/axios'

export interface MenuVO {
  id: number
  name: string
  permission: string
  type: number
  sort: number
  parentId: number
  path: string
  icon: string
  component: string
  status: number
  visible: boolean
  keepAlive: boolean
  createTime: Date
}

export interface MenuPageReqVO {
  name?: string
  status?: number
}

// 查询菜单（精简）列表
export const listSimpleMenusApi = () => {
  return defHttp.get({ url: '/system/menu/list-all-simple' })
}

// 查询菜单列表
export const getMenuListApi = (params: MenuPageReqVO) => {
  return defHttp.get({ url: '/system/menu/list', params })
}

// 获取菜单详情
export const getMenuApi = (id: number) => {
  return defHttp.get({ url: '/system/menu/get?id=' + id })
}

// 新增菜单
export const createMenuApi = (data: MenuVO) => {
  return defHttp.post({ url: '/system/menu/create', data })
}

// 修改菜单
export const updateMenuApi = (data: MenuVO) => {
  return defHttp.put({ url: '/system/menu/update', data })
}

// 删除菜单
export const deleteMenuApi = (id: number) => {
  return defHttp.delete({ url: '/system/menu/delete?id=' + id })
}
