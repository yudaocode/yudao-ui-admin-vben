import {
  AccountParams,
  DeptListItem,
  MenuParams,
  RoleParams,
  RolePageParams,
  MenuListGetResultModel,
  DeptListGetResultModel,
  AccountListGetResultModel,
  RolePageListGetResultModel,
  RoleListGetResultModel
} from './model/systemModel'
import { defHttp } from '@/utils/http/axios'

enum Api {
  AccountList = '/system/getAccountList',
  IsAccountExist = '/system/accountExist',
  DeptList = '/system/getDeptList',
  setRoleStatus = '/system/setRoleStatus',
  MenuList = '/system/getMenuList',
  RolePageList = '/system/getRoleListByPage',
  GetAllRoleList = '/system/getAllRoleList'
}

export const getAccountList = (params: AccountParams) => {
  return defHttp.get<AccountListGetResultModel>({ url: Api.AccountList, params })
}

export const getDeptList = (params?: DeptListItem) => {
  return defHttp.get<DeptListGetResultModel>({ url: Api.DeptList, params })
}

export const getMenuList = (params?: MenuParams) => {
  return defHttp.get<MenuListGetResultModel>({ url: Api.MenuList, params })
}

export const getRoleListByPage = (params?: RolePageParams) => {
  return defHttp.get<RolePageListGetResultModel>({ url: Api.RolePageList, params })
}

export const getAllRoleList = (params?: RoleParams) => {
  return defHttp.get<RoleListGetResultModel>({ url: Api.GetAllRoleList, params })
}

export const setRoleStatus = (id: number, status: string) => {
  return defHttp.post({ url: Api.setRoleStatus, params: { id, status } })
}

export const isAccountExist = (account: string) => {
  return defHttp.post({ url: Api.IsAccountExist, params: { account } }, { errorMessageMode: 'none' })
}
